import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../app/hooks.js";
import { NAV_ITEMS } from "../app/nav-items.js";

export function DesktopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const health = useAppSelector((state) => state.health);

  return (
    <Paper component="nav" elevation={1}>
      <List>
        {NAV_ITEMS.map((item) => (
          <ListItemButton
            key={item.path}
            selected={
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`)
            }
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem>
          <ListItemText primary="LOCAL SERVER" secondary={health.label} />
        </ListItem>
        <ListItemButton onClick={() => navigate("/scan")}>
          <ListItemIcon>
            <PlayCircleOutlineRoundedIcon />
          </ListItemIcon>
          <ListItemText primary="Scan photos" />
        </ListItemButton>
      </List>
    </Paper>
  );
}
