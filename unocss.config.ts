import { defineConfig, presetIcons } from 'unocss';
import { presetStarlightIcons } from 'starlight-plugin-icons/uno';

export default defineConfig({
  presets: [
    presetStarlightIcons(),
    presetIcons({
      autoInstall: false,
      extraProperties: {
        display: 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
});
