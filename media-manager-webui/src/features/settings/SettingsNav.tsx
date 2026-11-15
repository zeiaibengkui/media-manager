import {
  List,
  ListItemButton,
  ListItemText,
  Tab,
  Tabs,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";

const ITEMS = [
  { path: "/settings/server", label: "Server connection" },
  { path: "/settings/scan", label: "Scan defaults" },
];

export function SettingsNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const desktop = useMediaQuery(useTheme().breakpoints.up("md"));

  if (!desktop) {
    return (
      <Tabs value={location.pathname} variant="scrollable" scrollButtons="auto">
        {ITEMS.map((item) => (
          <Tab
            key={item.path}
            value={item.path}
            label={item.label}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Tabs>
    );
  }

  return (
    <List>
      {ITEMS.map((item) => (
        <ListItemButton
          key={item.path}
          selected={location.pathname === item.path}
          onClick={() => navigate(item.path)}
        >
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  );
}
