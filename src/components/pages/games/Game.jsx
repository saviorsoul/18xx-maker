import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useMatch, useNavigate } from "react-router";

import { useGame } from "@/hooks";
import { loadGame } from "@/state";
import capability from "@/util/capability";

const addRecent = (game) => {
  if (game && capability.electron) {
    window.api.addRecent(game.info.title, game.meta.slug);
  }
  return game;
};

const Game = () => {
  const game = useGame();
  const match = useMatch("/games/:slug/*");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!game || match.params.slug !== decodeURIComponent(game.meta.slug)) {
      dispatch(loadGame(match.params.slug))
        .then(addRecent)
        .catch(() => navigate("/games/"));
    }
  }, [dispatch, game, navigate, match]);

  if (!game) {
    return null;
  }

  return <Outlet />;
};

export default Game;
