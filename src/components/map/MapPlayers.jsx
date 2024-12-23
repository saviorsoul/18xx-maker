import { addIndex, map } from "ramda";

import Color from "@/components/Color";
import Currency from "@/components/Currency";
import { iconImages } from "@/data";
import { useConfig, useGame } from "@/hooks";

const icons = {
  certLimit: iconImages["certificate"],
  bank: iconImages["university"],
  number: iconImages["user-friends"],
  capital: iconImages["coins"],
};

const MapPlayers = ({ players, hexWidth }) => {
  const game = useGame();
  const { config } = useConfig();

  if (!players) {
    return null;
  }

  let scale = hexWidth / 150.0;
  let x = (players.x || 0) * scale + 50;
  let y = (players.y || 0) * scale + 50;

  let iconWidth = 15 * scale;
  let cellWidth = (players.cellWidth || 60) * scale;
  let rowHeight = (players.rowHeight || 30) * scale;
  let fontSize = (players.fontSize || 15) * scale;

  const Icon = ({ name, y }) => {
    let Tag = icons[name];
    return (
      <Tag
        width={iconWidth}
        height={iconWidth}
        x={7 * scale}
        y={7 * scale + (y || 0)}
      />
    );
  };

  return (
    <Color>
      {(c) => {
        if (!config.maps.players) {
          return null;
        }

        let line = {
          strokeWidth: 1,
          stroke: c("black"),
          fill: "none",
        };
        let dashed = {
          ...line,
          strokeDasharray: 4,
        };

        let iconsWidth = 2 * iconWidth;
        let playersWidth = game.players.length * cellWidth;
        let totalWidth = iconsWidth + playersWidth;

        const GameValue = ({ game, field, currency }) => {
          let value = game[field];
          return (
            <g key={`game-value-${field}`}>
              <path d={`M 0 0 l 0 ${rowHeight}`} {...line} />
              <text
                width={playersWidth}
                height={rowHeight}
                x={0.5 * playersWidth}
                y={fontSize}
                fontSize={fontSize}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {currency ? <Currency value={value} type={currency} /> : value}
              </text>
            </g>
          );
        };

        const PlayerValue = ({ players, field, currency }) => {
          return addIndex(map)((p, i) => {
            return (
              <g
                key={`player-value-${field}-${i}`}
                transform={`translate(${i * cellWidth} 0)`}
              >
                <path
                  d={`M 0 0 l 0 ${rowHeight}`}
                  {...(i === 0 ? line : dashed)}
                />
                <text
                  width={cellWidth}
                  height={rowHeight}
                  x={0.5 * cellWidth}
                  y={fontSize}
                  fontSize={fontSize}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {currency ? (
                    <Currency value={p[field]} type={currency} />
                  ) : (
                    p[field]
                  )}
                </text>
              </g>
            );
          }, players);
        };

        const Value = ({ game, field, currency, row }) => {
          if (game[field]) {
            // Game value
            return <GameValue {...{ game, field, currency, row }} />;
          }

          return (
            <PlayerValue players={game.players} {...{ field, currency, row }} />
          );
        };

        const Row = ({ game, field, currency, row }) => {
          return (
            <g transform={`translate(0 ${row * rowHeight})`}>
              <Icon name={field} />
              {row > 0 && <path d={`M 0 0 L ${totalWidth} 0`} {...line} />}
              <g transform={`translate(${2 * iconWidth} 0)`}>
                <Value {...{ game, field, currency, row }} />
              </g>
            </g>
          );
        };

        return (
          <g transform={`translate(${x} ${y})`}>
            <Row {...{ game, field: "number", row: 0 }} />
            <Row {...{ game, field: "bank", currency: "bank", row: 1 }} />
            <Row {...{ game, field: "capital", currency: "capital", row: 2 }} />
            <Row {...{ game, field: "certLimit", row: 3 }} />
          </g>
        );
      }}
    </Color>
  );
};

export default MapPlayers;
