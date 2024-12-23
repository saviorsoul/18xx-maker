import { defaultTo } from "ramda";

import Color from "@/components/Color";
import Text from "@/components/atoms/shapes/Text";
import { useGame } from "@/hooks";
import { getFontProps, multiDefaultTo } from "@/util";

const Ellipse = (props) => {
  let {
    text,
    textColor,
    fontFamily,
    color,
    opacity,
    borderColor,
    borderWidth,
    width,
    height,
    dashed,
  } = props;
  const game = useGame();

  let scale = defaultTo(50, width) / 50;
  let hscale = defaultTo(50, height) / 50;
  let font = getFontProps(
    props,
    16 * scale,
    undefined,
    multiDefaultTo(undefined, fontFamily, game.info.valueFontFamily),
  );

  let strokeDashArray = dashed
    ? `${width / 7.142857143} ${width / 7.142857143}`
    : undefined;
  let rx = 25 * scale;
  let ry = 25 * hscale;

  return (
    <Color>
      {(c) => (
        <g>
          <ellipse
            rx={rx}
            ry={ry}
            fill={defaultTo("none", c(color))}
            fillOpacity={defaultTo(1, opacity)}
            stroke={c(defaultTo("black", borderColor))}
            strokeWidth={defaultTo(2, borderWidth)}
            strokeDasharray={strokeDashArray}
            strokeLinecap="round"
          />
          <Text
            {...font}
            text={text}
            color={textColor}
            fontFamily={fontFamily}
          />
        </g>
      )}
    </Color>
  );
};

export default Ellipse;
