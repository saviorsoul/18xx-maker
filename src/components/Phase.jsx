import * as R from "ramda";

import Color from "@/components/Color";
import Currency from "@/components/Currency";

const formatCell = (value) => {
  if (Array.isArray(value)) {
    return R.addIndex(R.chain)(
      (v, i) => [
        <Currency key={`currency-${i}`} value={v} type="train" />,
        <br key={`br-${i}`} />,
      ],
      value,
    );
  } else {
    return <Currency value={value} type="train" />;
  }
};

const filterPhase = R.curry((minor, company, phase) => {
  if (phase.company && phase.company !== company) {
    return false;
  }

  if (!phase.minor === minor) {
    return false;
  }

  return true;
});

const include = (field, phases, minor, company) => {
  return !R.all(
    R.compose(R.isNil, R.prop(field)),
    R.filter(filterPhase(minor, company), phases || []),
  );
};

const trainInclude = (field, trains) => {
  return !R.all(R.compose(R.isNil, R.prop(field)), trains || []);
};

const matchTrain = R.curry((phase, train) => {
  if (train.phase === false) {
    return false;
  }

  if (phase.train) {
    if (phase.train === train.name) {
      return true;
    }

    if (Array.isArray(phase.train) && phase.train.includes(train.name)) {
      return true;
    }

    return false;
  }

  return phase.name === train.name;
});

const matchTrainEvent = R.curry((eventTrain, event, train) => {
  if (train.phase === false) {
    return false;
  }

  let trainEvent = train[event];
  let events = R.is(Array, trainEvent) ? [...trainEvent] : [...[trainEvent]];

  return R.any((e) => {
    if (R.is(Object, e)) {
      return e.on === eventTrain.name;
    }

    return e === eventTrain.name;
  }, events);
});

const matchEvent = R.curry((phaseTrains, event, train) => {
  return R.any((pt) => matchTrainEvent(pt, event, train), phaseTrains);
});

const Phase = ({ phases, trains, minor, company }) => {
  let includeName = include("name", phases, minor, company);
  let includePhase = include("phase", phases, minor, company);
  let includeTrain =
    trains && trains.length > 0 && include("train", phases, minor, company);
  let includeTiles = include("tiles", phases, minor, company);
  let includeLimit = include("limit", phases, minor, company);
  let includeNotes = include("notes", phases, minor, company);

  let includePrice = trainInclude("price", trains);
  let includeQuantity = trainInclude("quantity", trains);
  let includeRust = trainInclude("rust", trains);
  let includeObsolete = trainInclude("obsolete", trains);
  let includePhased = trainInclude("phased", trains);

  let phaseRows = R.compose(
    R.map((phase) => {
      let notes = phase.notes
        ? Array.isArray(phase.notes)
          ? [...phase.notes]
          : [phase.notes]
        : [];
      if (phase.buy_companies) {
        notes.push("Private companies may be purchased.");
      }
      if ((phase.events || {}).close_companies) {
        notes.push("Private companies close.");
      }
      if ((phase.events || {}).remove_tokens) {
        notes.push("Private tokens removed.");
      }
      let noteNodes = R.addIndex(R.map)((n, i) => <li key={i}>{n}</li>, notes);

      // Find all trains linked to this phase
      let phaseTrains = R.filter(matchTrain(phase), trains || []);

      // Get the names for each train
      let trainNodes = R.map(
        (train) => (
          <Color key={train.name}>
            {(c) => (
              <li
                style={{
                  backgroundColor: train.color ? c(train.color) : c("white"),
                }}
              >
                {train.name}
              </li>
            )}
          </Color>
        ),
        phaseTrains,
      );

      // Prices for each trach
      let prices = R.map(
        (t) => <li key={t.name}>{formatCell(t.price)}</li>,
        phaseTrains,
      );

      // Quantities for each train
      let quantities = R.map(
        (t) => <li key={t.name}>{t.quantity_label || t.quantity}</li>,
        phaseTrains,
      );

      // Get all trains that rust on this phase
      let rustingTrains = R.filter(
        matchEvent(phaseTrains, "rust"),
        trains || [],
      );

      // Which trains rust during this phase
      let rusts = R.map(
        (t) => (
          <Color key={t.name}>
            {(c) => (
              <li
                style={{ backgroundColor: t.color ? c(t.color) : c("white") }}
              >
                {t.name}
              </li>
            )}
          </Color>
        ),
        rustingTrains,
      );

      // Get all trains that rust on this phase
      let obsoleteTrains = R.filter(
        matchEvent(phaseTrains, "obsolete"),
        trains || [],
      );

      // Which trains rust during this phase
      let obsoletes = R.map(
        (t) => <li key={t.name}>{t.name}</li>,
        obsoleteTrains,
      );

      // Get all trains that rust on this phase
      let phasedTrains = R.filter(
        matchEvent(phaseTrains, "phased"),
        trains || [],
      );

      // Which trains rust during this phase
      let phased = R.map((t) => <li key={t.name}>{t.name}</li>, phasedTrains);

      let key = phase.name || phase.train;

      return (
        <Color key={key}>
          {(c) => (
            <tr>
              {includeName && <td>{phase.name}</td>}
              {includePhase && <td>{phase.phase}</td>}
              {includeTrain && (
                <td
                  className="phase__list"
                  style={{
                    backgroundColor:
                      phaseTrains.length > 0 && phaseTrains[0].color
                        ? c(phaseTrains[0].color)
                        : c("white"),
                  }}
                >
                  <ul>{trainNodes}</ul>
                </td>
              )}
              {includePrice && (
                <td>
                  <ul>{prices}</ul>
                </td>
              )}
              {includeQuantity && (
                <td>
                  <ul>{quantities}</ul>
                </td>
              )}
              {includeLimit && <td>{phase.limit}</td>}
              {includePhased && (
                <td>
                  <ul>{phased}</ul>
                </td>
              )}
              {includeObsolete && (
                <td>
                  <ul>{obsoletes}</ul>
                </td>
              )}
              {includeRust && (
                <td
                  className="phase__list"
                  style={{
                    backgroundColor:
                      rustingTrains.length > 0 && rustingTrains[0].color
                        ? c(rustingTrains[0].color)
                        : c("white"),
                  }}
                >
                  <ul>{rusts}</ul>
                </td>
              )}
              {includeTiles && (
                <td style={{ backgroundColor: c(phase.tiles) }}>&nbsp;</td>
              )}
              {includeNotes && (
                <td className="phase__notes">
                  <ul>{noteNodes}</ul>
                </td>
              )}
            </tr>
          )}
        </Color>
      );
    }),
    R.filter(filterPhase(minor, company)),
  )(phases || []);

  if (phaseRows.length === 0) {
    return null;
  }

  return (
    <table>
      <thead>
        <tr>
          {includeName && <th>Name</th>}
          {includePhase && <th>Phase</th>}
          {includeTrain && <th>Train</th>}
          {includePrice && <th>Price</th>}
          {includeQuantity && <th>#</th>}
          {includeLimit && <th>Limit</th>}
          {includePhased && <th>Phased</th>}
          {includeObsolete && <th>Obsolete</th>}
          {includeRust && <th>Rust</th>}
          {includeTiles && <th>Tiles</th>}
          {includeNotes && <th className="phase__notes">Notes</th>}
        </tr>
      </thead>
      <tbody>{phaseRows}</tbody>
    </table>
  );
};

export default Phase;
