import { useState } from "react";
import {
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import ComputerRoundedIcon from "@mui/icons-material/ComputerRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import { useColorScheme } from "@mui/material/styles";

const MODES = [
  { value: "system", label: "System", icon: <ComputerRoundedIcon fontSize="small" /> },
  { value: "light", label: "Light", icon: <LightModeRoundedIcon fontSize="small" /> },
  { value: "dark", label: "Dark", icon: <DarkModeRoundedIcon fontSize="small" /> },
] as const;

export function ThemeModeMenu() {
  const { mode, setMode } = useColorScheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = mode ?? "system";
  const icon = MODES.find((item) => item.value === active)?.icon ?? <ComputerRoundedIcon />;

  return (
    <>
      <Tooltip title="Theme">
        <IconButton aria-label="Choose theme" onClick={(event) => setAnchor(event.currentTarget)}>
          {icon}
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
        {MODES.map((item) => (
          <MenuItem
            key={item.value}
            selected={item.value === active}
            onClick={() => {
              setMode(item.value);
              setAnchor(null);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
