import { Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../app/nav-items.js";

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePath =
    NAV_ITEMS.find((item) =>
      location.pathname === item.path || location.pathname.startsWith(`${item.path}/`),
    )?.path ?? location.pathname;

  return (
    <Tabs value={activePath} variant="scrollable" scrollButtons="auto">
      {NAV_ITEMS.map((item) => (
        <Tab
          key={item.path}
          value={item.path}
          label={item.label}
          icon={item.icon}
          onClick={() => navigate(item.path)}
        />
      ))}
    </Tabs>
  );
}
