import fs from "node:fs";
import path from "node:path";

import archiver from "archiver";
import express from "express";
import { chromium } from "playwright";

import {
  ascend,
  compose,
  countBy,
  defaultTo,
  head,
  identity,
  is,
  join,
  juxt,
  keys,
  map,
  mapObjIndexed,
  mergeDeepRight,
  prop,
  propEq,
  reject,
  sortWith,
  tail,
  toUpper,
  uniq,
} from "ramda";

import { setup, setupB18 } from "../src/cli/util.js";
import defaultConfig from "../src/defaults.json" with { type: "json" };

let customConfig = {};
if (fs.existsSync(path.resolve("../src/config.json"))) {
  customConfig = await import("../src/config.json", { with: { type: "json" } });
}

const config = mergeDeepRight(defaultConfig, customConfig);

const capitalize = compose(join(""), juxt([compose(toUpper, head), tail]));

const tileColors = [
  "yellow",
  "yellow/green",
  "green",
  "green/brown",
  "brown",
  "brown/gray",
  "gray",
  "offboard",
  "water",
  "mountain",
  "tunnel",
  "other",
  "none",
];
const colorSort = compose(
  tileColors.indexOf.bind(tileColors),
  prop("color"),
  defaultTo({ color: "other" }),
);
const sortTiles = sortWith([ascend(colorSort)]);

setup();

// Startup server
const app = express();

app.use(express.static(path.join(process.cwd(), "dist/site")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(process.cwd(), "dist/site", "index.html"));
});

const server = app.listen(9000);

(async () => {
  if (process.argv[2] === "debug") return;

  let bname = process.argv[2];
  let version = process.argv[3];
  let id = `${bname}-${version}`;
  let folder = `board18-${id}`;
  let author = process.argv[4];

  let game = await import(`../src/data/games/${bname}.json`, {
    with: { type: "json" },
  }).then((mod) => mod.default);
  let tiles = await import("../src/data/tiles/index.js").then(
    (mod) => mod.default,
  );

  const gutil = await import("../src/util/index.js");
  const getTile = gutil.getTile(tiles, game.tiles || {});

  const { getMapData } = await import("../src/util/map.js");
  let mapData = getMapData(game, config.coords, 100, 0);

  // Test games:
  // 1861: Horizontal with valid A1
  // 1858: Horizontal with invalid A1
  // 1871BC: Veritcal with valid A1
  // 18LA: Veritical with invalid A1

  let json = {
    bname,
    version,
    author,
    board: {
      imgLoc: `images/${id}/Map.png`,
      xStart: mapData.horizontal ? 50 : mapData.a1Valid === false ? 0 : 50,
      orientation: mapData.horizontal ? "F" : "P",
      xStep: mapData.horizontal ? 87 : 50,
      yStart: 50,
      yStep: mapData.horizontal ? 50 : 87,
    },
    market: {
      imgLoc: `images/${id}/Market.png`,
      xStart: 25 * 0.96,
      xStep: config.stock.cell.width * 0.96,
      yStart: (game.stock.title === false ? 25 : 75) * 0.96,
      yStep:
        (game.stock.type === "2D"
          ? config.stock.cell.height
          : game.stock.type === "1Diag"
            ? (config.stock.cell.height * config.stock.column) / 2
            : config.stock.cell.height * config.stock.column) * 0.96,
    },
    tray: [],
    links: [],
  };

  if (game.links) {
    if (game.links.bgg) {
      json.links.push({
        link_name: `${bname} on BGG`,
        link_url: game.links.bgg,
      });
    }
    if (game.links.rules) {
      json.links.push({
        link_name: `Rules`,
        link_url: game.links.rules,
      });
    }
  }

  setupB18(bname, version);
  let counts = compose(
    countBy(identity),
    map(prop("color")),
    sortTiles,
    uniq,
    map(getTile),
  )(keys(game.tiles));
  let colors = keys(counts);

  // Tile Trays
  for (let j = 0; j < colors.length; j++) {
    let color = colors[j];
    let color_filename = color.replace("/", "_");

    let tray = {
      type: "tile",
      tName: `${capitalize(color)} Tiles`,
      imgLoc: `images/${id}/${capitalize(color_filename)}.png`,
      xStart: 24,
      yStart: 24,
      xStep: 150,
      yStep: 150,
      xSize: game.info.orientation === "horizontal" ? 116 : 100,
      ySize: game.info.orientation === "horizontal" ? 100 : 116,
      tile: [],
    };

    mapObjIndexed((dups, id) => {
      let tile = getTile(id);
      if (tile.color !== color) return;

      // Merge tile with game tile
      if (is(Object, game.tiles[id])) {
        tile = { ...tile, ...game.tiles[id] };
      }

      // Figure out rotations
      let rots = 6;
      if (is(Number, tile.rotations)) {
        rots = tile.rotations;
      } else if (is(Array, tile.rotations)) {
        rots = tile.rotations.length;
      }

      tray.tile.push({
        rots,
        dups: tile.quantity === "∞" ? 0 : tile.quantity,
      });
    }, game.tiles);

    json.tray.push(tray);
  }

  // Token Trays
  let btok = {
    type: "btok",
    tName: "Tokens",
    imgLoc: `images/${id}/Tokens.png`,
    xStart: 0,
    xSize: 30,
    xStep: 30,
    yStart: 0,
    ySize: 30,
    yStep: 30,
    token: [],
  };
  let mtok = { ...btok, type: "mtok", token: [] };

  map(
    (company) => {
      btok.token.push({
        dups: company.tokens.length + (game.info.extraStationTokens || 0),
        flip: true,
      });
      mtok.token.push({
        flip: true,
      });
    },
    gutil.compileCompanies(game) || [],
  );

  // "quantity" of 0 mean remove the token entirely from the array
  // "quantity of "∞" means we put the special value of 0 in for dups
  // otherwise, "quantity" is the number of dups
  let tokens = compose(
    map((extra) => {
      btok.token.push({
        dups: extra.quantity === "∞" ? 0 : extra.quantity || 1,
        flip: true,
      });
    }),
    reject(propEq(0, "quantity")),
  )(game.tokens || []);
  let tokenHeight = 30 * ((game.companies || []).length + tokens.length);

  json.tray.push(btok);
  json.tray.push(mtok);

  const browser = await chromium.launch({
    args: ["--force-color-profile srgb"],
  });
  const page = await browser.newPage();

  let printWidth = Math.ceil(mapData.b18TotalWidth);
  let printHeight = Math.ceil(mapData.b18TotalHeight);
  let offset = 0;

  if (mapData.horizontal && mapData.a1Valid === false) {
    offset = 87;
  }

  console.log(`Printing ${bname}/${folder}/${id}/Map.png`);
  await page.goto(`http://localhost:9000/games/${bname}/b18/map?print=true`, {
    waitUntil: "networkidle",
  });
  await page.setViewportSize({
    width: printWidth + offset,
    height: printHeight,
  });
  await page.screenshot({
    path: `render/${bname}/${folder}/${id}/Map.png`,
  });

  console.log(`Printing ${bname}/${folder}/${id}/Market.png`);
  const mutil = await import("../src/util/market.js");
  let marketData = mutil.getMarketData(game.stock, config);
  let marketWidth = Math.ceil((marketData.totalWidth + 50) * 0.96);
  let marketHeight = Math.ceil((marketData.totalHeight + 50) * 0.96);
  await page.goto(`http://localhost:9000/games/${bname}/market?print=true`, {
    waitUntil: "networkidle",
  });
  await page.setViewportSize({
    width: marketWidth + 1,
    height: marketHeight + 1,
  });
  await page.screenshot({
    path: `render/${bname}/${folder}/${id}/Market.png`,
  });

  console.log(`Printing ${bname}/${folder}/${id}/Tokens.png`);
  await page.goto(
    `http://localhost:9000/games/${bname}/b18/tokens?print=true`,
    { waitUntil: "networkidle" },
  );
  await page.setViewportSize({ width: 60, height: tokenHeight });
  await page.screenshot({
    path: `render/${bname}/${folder}/${id}/Tokens.png`,
    omitBackground: true,
  });

  // Board18 Tiles
  for (let j = 0; j < colors.length; j++) {
    let color = colors[j];
    let color_filename = color.replace("/", "_");

    let width = counts[color] * 150;
    let height = 900;

    console.log(
      `Printing ${bname}/${folder}/${id}/${capitalize(color_filename)}.png`,
    );
    await page.goto(
      `http://localhost:9000/games/${bname}/b18/tiles/${color}?print=true`,
      { waitUntil: "networkidle" },
    );
    await page.setViewportSize({ width, height });
    await page.screenshot({
      path: `render/${bname}/${folder}/${id}/${capitalize(color_filename)}.png`,
      omitBackground: true,
    });
  }
  await browser.close();

  await server.close();

  console.log(`Writing  ${bname}/${folder}/${id}.json`);
  fs.writeFileSync(
    `render/${bname}/${folder}/${id}.json`,
    JSON.stringify(json, null, 2),
  );

  console.log(`Creating ${bname}/${folder}.zip`);

  const output = fs.createWriteStream(`render/${bname}/${folder}.zip`);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });
  archive.pipe(output);
  archive.directory(`render/${bname}/${folder}`, `${folder}`);
  archive.finalize();
})();
