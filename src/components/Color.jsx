import tinycolor from "tinycolor2";

import { curry, defaultTo, is, mergeDeepRight, prop } from "ramda";

import ColorContext from "@/context/ColorContext";
import PhaseContext from "@/context/PhaseContext";
import { companyThemes, mapThemes } from "@/data";
import { useConfig, useGame } from "@/hooks";

const colorAliases = {
  cyan: "lightBlue",
  grey: "gray",
  lightGreen: "brightGreen",
  navy: "navyBlue",
  purple: "violet",
};

const resolveColor = curry(
  (theme, companiesTheme, phase, context, game, name) => {
    if (colorAliases[name]) {
      name = colorAliases[name];
    }

    let colors = prop(
      "colors",
      defaultTo(prop("gmt", mapThemes), prop(theme, mapThemes)),
    );

    // Add in company colors
    colors["companies"] = mergeDeepRight(
      prop("colors", prop("rob", companyThemes)),
      prop(
        "colors",
        defaultTo(
          prop("rob", companyThemes),
          prop(companiesTheme, companyThemes),
        ),
      ),
    );

    // Add in game colors
    colors = mergeDeepRight(colors, game ? game.colors || {} : {});

    // Get color from context if it exists
    let color = colors[name];
    if (colors[context] && colors[context][name]) {
      color = colors[context][name];
    }

    // If color is an object use phase
    if (is(Object, color)) {
      color = color[phase || "default"] || color["default"];
    }
    return color;
  },
);

const textColor = curry((theme, companiesTheme, phase, game, color) => {
  let text = [
    resolveColor(theme, companiesTheme, phase, null, game, "white"),
    resolveColor(theme, companiesTheme, phase, null, game, "black"),
  ];
  let tc = tinycolor(color);
  return tinycolor.mostReadable(tc, text).toRgbString();
});

const strokeColor = (color, amount = 20) => {
  let tc = tinycolor(color);

  if (amount >= 0) {
    return tc.darken(amount).toString();
  } else {
    return tc.lighten(-1 * amount).toString();
  }
};

const Color = ({ context, children }) => {
  const { config } = useConfig();
  const game = useGame();
  const { theme, companiesTheme } = config;

  return (
    <ColorContext.Consumer>
      {(colorContext) => (
        <PhaseContext.Consumer>
          {(phase) => {
            let c = resolveColor(
              theme,
              companiesTheme,
              phase,
              context || colorContext,
              game,
            );
            let p = resolveColor(theme, companiesTheme, phase, undefined, game);
            let t = textColor(theme, companiesTheme, phase, game);
            let s = strokeColor;

            return <>{children(c, t, s, p)}</>;
          }}
        </PhaseContext.Consumer>
      )}
    </ColorContext.Consumer>
  );
};

export default Color;
