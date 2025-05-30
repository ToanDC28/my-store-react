import { useTheme } from "@/providers/ThemeProvider"
import { Switch } from "./ui/switch"
import { Label } from "./ui/label"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} />
      <Label htmlFor="airplane-mode">{theme === "dark" ? "Dark Mode" : "Light Mode"}</Label>
    </div>
  )
}
