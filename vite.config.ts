import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'home_memo'

  return {
    plugins: [react()],
    base: mode === 'production' ? `/${repositoryName}/` : '/',
  }
})
