import React, {useState, useContext} from "react";
import { Route, Switch, matchPath } from "react-router";
import { useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useBooleanParam } from "../util/query";

import { Link } from "react-router-dom";

import MobileMenuButton from "./MobileMenuButton";

import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Hidden from "@material-ui/core/Hidden";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

import DocumentationIcon from '@material-ui/icons/Help';
import ElementsIcon from '@material-ui/icons/Category';
import HomeIcon from '@material-ui/icons/Home';

import GamesIcon from '@material-ui/icons/Train';
import LoadIcon from '@material-ui/icons/OpenInBrowser';
import MenuIcon from '@material-ui/icons/KeyboardArrowDown';

import { makeStyles } from '@material-ui/core/styles';
import GameContext from "../context/GameContext";

const useStyles = makeStyles((theme) => ({
  activeButton: {
    marginRight: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    "&:hover": {
      backgroundColor: theme.palette.background.default
    }
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1
  },
  warningIcon: {
    color: theme.palette.warning.main
  },
  errorIcon: {
    color: theme.palette.error.main
  },
  menuIcon: {
    marginRight: theme.spacing(2)
  },
  menuButton: {
    marginRight: theme.spacing(2)
  },
  title: {
    flexGrow: 1
  }
}));

const NavLink = ({to, exact, text, icon}) => {
  const classes = useStyles();
  const location = useLocation();
  const active = matchPath(location.pathname, { path: to, exact: exact });

  return (
    <Button variant={active && "outlined"}
            color={active ? "primary" : "inherit"}
            className={active ? classes.activeButton : classes.menuButton}
            startIcon={icon}
            component={Link}
            to={to}>
      <Typography noWrap>{text}</Typography>
    </Button>
  );
}

const getGameItem = (game, t) => {
  let to = "/games";
  let icon = <LoadIcon/>;
  let text = 'Load Games';

  if (game) {
    if (game.map) {
      to = `${to}/${game.slug}/map`;
    } else {
      to = `${to}/${game.slug}/`;
    }
    icon = <GamesIcon/>;
    text = game.info.title;
  }

  return { to, text, icon };
}

const NavMenu = () => {
  const { t } = useTranslation();
  const { game } = useContext(GameContext);

  return (
    <>
      <NavLink to="/" exact text={t('nav.home')} icon={<HomeIcon/>}/>
      <NavLink {...getGameItem(game, t)}/>
      <NavLink to="/elements/" exact text={t('nav.elements')} icon={<ElementsIcon/>}/>
      <NavLink to="/docs/" exact text={t('nav.documentation')} icon={<DocumentationIcon/>}/>
    </>
  );
};

const MenuLink = React.forwardRef(({icon, text, to, exact, onClick}, ref) => {
  const location = useLocation();
  const active = Boolean(matchPath(location.pathname, { path: to, exact: exact }));

  return (
    <MenuItem onClick={onClick}
              component={Link}
              ref={ref}
              to={to}
              selected={active}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text}/>
    </MenuItem>
  );
});

const MobileMenu = ({anchor, onClose}) => {
  const { t } = useTranslation();
  const open = Boolean(anchor);

  const { game } = useContext(GameContext);
  const item = getGameItem(game);

  return (
    <Menu id="appnav-menu"
          anchorEl={anchor}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          onClose={onClose}
          open={open}
          keepMounted>
      <MenuLink onClick={onClose} to="/" exact text={t('nav.home')} icon={<HomeIcon/>}/>
      <MenuLink onClick={onClose} {...item}/>
      <MenuLink onClick={onClose} to="/elements/" exact text={t('nav.elements')} icon={<ElementsIcon/>}/>
      <MenuLink onClick={onClose} to="/docs/" exact text={t('nav.documentation')} icon={<DocumentationIcon/>}/>
    </Menu>
  );
};

const MobileButton = ({onClick}) => {
  const { t } = useTranslation();
  const { game } = useContext(GameContext);
  const item = getGameItem(game);

  console.log(item);
  return (
    <Switch>
      <Route path="/" exact>
        <Button color="inherit"
                startIcon={<HomeIcon/>}
                endIcon={<MenuIcon/>}
                onClick={onClick}
                aria-haspopup="true">
          <Typography noWrap>{t('nav.home')}</Typography>
        </Button>
      </Route>
      <Route path={item.to}>
        <Button color="inherit"
                startIcon={item.icon}
                endIcon={<MenuIcon/>}
                onClick={onClick}
                aria-haspopup="true">
          <Typography noWrap>{item.text}</Typography>
        </Button>
      </Route>
      <Route path="/elements">
        <Button color="inherit"
                startIcon={<ElementsIcon/>}
                endIcon={<MenuIcon/>}
                onClick={onClick} aria-haspopup="true">
          <Typography noWrap>{t('nav.elements')}</Typography>
        </Button>
      </Route>
      <Route path="/docs">
        <Button color="inherit"
                startIcon={<DocumentationIcon/>}
                endIcon={<MenuIcon/>}
                onClick={onClick}
                aria-haspopup="true">
          <Typography noWrap>{t('nav.documentation')}</Typography>
        </Button>
      </Route>
    </Switch>
  );
};

const AppNav = ({toggleSideNav}) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [print] = useBooleanParam('print');

  if (print) {
    return null;
  }

  const handleMenu = (event) => {
    setMenuAnchor(event.currentTarget);
  }

  const handleMenuClose = () => {
    setMenuAnchor(null);
  }

  return (
    <AppBar position="sticky" className={classes.appBar} style={{display: print && "none"}}>
      <Toolbar>
        <MobileMenuButton onClick={toggleSideNav}/>
        <Typography className={classes.title} variant="h4" noWrap>
          {t('title')}
        </Typography>
        <Hidden mdUp>
          <MobileButton onClick={handleMenu}/>
          <MobileMenu anchor={menuAnchor} onClose={handleMenuClose}/>
        </Hidden>
        <Hidden smDown>
          <NavMenu/>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
}

export default AppNav;