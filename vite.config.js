import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages では https://oxidesilver.github.io/fitness-tracker/ に公開されるため
  base: '/fitness-tracker/',
})
