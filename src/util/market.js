import { length, max, reduce } from "ramda";

// TODO: Relative import since this is used in the CLI
import { unitsToCss } from "./index.js";

export const getMaxLength = reduce((acc, row) => {
  return max(acc, length(row));
}, 0);

// Given the stock section of a game and the stock config.json section, compute
// data that we need.
export const getMarketData = (stock, config) => {
  let {
    stock: { cell, column, diag },
  } = config;

  let width = 0;
  let height = 0;
  let rows = 0;
  let columns = 0;
  let cellWidth =
    (stock.cell && stock.cell.width ? stock.cell.width : 1) * cell.width;
  let cellHeight =
    (stock.cell && stock.cell.height ? stock.cell.height : 1) * cell.height;

  switch (stock.type) {
    case "1Diag":
      width = cellWidth;
      height = diag * cellHeight;
      rows = 2;
      columns = Math.ceil(length(stock.market) / 2);
      break;
    case "1D":
      width = cellWidth;
      height = column * cellHeight;
      rows = 1;
      columns = length(stock.market);
      break;
    case "2D":
      width = cellWidth;
      height = cellHeight;
      rows = length(stock.market);
      columns = getMaxLength(stock.market);
      break;
    default:
      break;
  }

  // Now with width and height set we can figure out total height and total
  // width
  let totalWidth = width * columns + 10;
  let totalHeight = height * rows + (stock.title === false ? 0 : 50);

  // Are we displaying par, if so does this add to the height or width?
  if (stock.display && stock.display.par) {
    let parData = getParData(stock, config);
    let parTotalWidth = parData.totalWidth + width * stock.display.par.x;
    let parTotalHeight =
      parData.totalHeight +
      (stock.type === "1Diag" ? height / 2 : height) * stock.display.par.y +
      50;

    totalWidth = max(totalWidth, parTotalWidth);
    totalHeight = max(totalHeight, parTotalHeight);
  }

  let humanWidth = `${Math.ceil(totalWidth / 100.0)}in`;
  let humanHeight = `${Math.ceil(totalHeight / 100.0)}in`;

  if (stock.type === "1D" || stock.type === "1Diag") {
    if (
      config.stock.display.legend &&
      stock.legend &&
      stock.legend.length > 0
    ) {
      // Add space for legend
      totalHeight += 50;
    }
  }
  totalHeight +=
    stock.display && stock.display.extraTotalHeight
      ? stock.display.extraTotalHeight
      : 0;
  totalWidth +=
    stock.display && stock.display.extraTotalWidth
      ? stock.display.extraTotalHeight
      : 0;

  return {
    type: stock.type || "2D",
    ledges: stock.ledges || [],
    legend: stock.legend || [],
    market: stock.market || [],
    par: stock.par || {},
    cell: stock.cell || {},
    display: stock.display || {},
    width,
    height,
    humanWidth,
    humanHeight,
    totalWidth,
    totalHeight,
    rows,
    columns,
    stock,
    config,

    css: {
      width: unitsToCss(width),
      height: unitsToCss(height),
      totalWidth: unitsToCss(totalWidth),
      totalHeight: unitsToCss(totalHeight),
    },
  };
};

// Give the stock section of a game and the stock config.json section, compute
// data that we need.
export const getRevenueData = (revenue, config) => {
  let {
    stock: { cell },
  } = config;

  revenue = revenue || {};
  let min = revenue.min || 1;
  let max = revenue.max || 100;
  let perRow = revenue.perRow || 20;

  let width = cell.width;
  let height = cell.height;
  let rows = Math.ceil(max / perRow);
  let columns = perRow;

  let totalWidth = width * columns;
  let totalHeight = height * rows + 50; // Add space for the title

  return {
    min,
    max,
    perRow,
    width,
    height,
    totalWidth,
    totalHeight,
    rows,
    columns,

    css: {
      width: unitsToCss(width),
      height: unitsToCss(height),
      totalWidth: unitsToCss(totalWidth),
      totalHeight: unitsToCss(totalHeight),
    },
  };
};

// Give the stock section of a game and the stock config.json section, compute
// data that we need.
export const getParData = (stock, config) => {
  let {
    stock: { cell, par },
  } = config;

  let values = (stock.par && stock.par.values) || [];

  let width = (stock.par.width || par) * cell.width;
  let height = (stock.par.height || 1) * cell.height;
  let rows = length(stock.par.values);
  let columns = getMaxLength(stock.par.values) || 1;
  let totalWidth = width * columns;
  let totalHeight = height * rows + (stock.title === false ? 0 : 50);

  return {
    values,
    par: stock.par || {},
    legend: stock.legend || [],

    rows,
    columns,

    width,
    height,
    totalWidth,
    totalHeight,

    css: {
      width: unitsToCss(width),
      height: unitsToCss(height),
      totalWidth: unitsToCss(totalWidth),
      totalHeight: unitsToCss(totalHeight),
    },
  };
};
