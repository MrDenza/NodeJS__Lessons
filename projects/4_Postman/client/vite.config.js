import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'path'

// Полная перезагрузка страницы вместо горячей
/*const fullReloadAlways = {
  handleHotUpdate({ server }) {
    server.ws.send({ type: "full-reload" });
    return [];
  },
};*/

// https://vitejs.dev/config/
export default defineConfig({
	// resolve: {
	//   alias: {
	//     '@': resolve(__dirname, 'source'), // Устанавливаем '@' как псевдоним для папки 'src'
	//   },
	// },
	plugins: [react() /*, fullReloadAlways*/],
	base: "/",
	resolve: {
		extensions: [".js", ".jsx", ".ts", ".tsx"],
	},
	server: {
		port: 3000,
		proxy: {
			'/api': {
				target: 'http://localhost:3053', // Адрес бэкенд-сервера
				changeOrigin: true, // Изменяет заголовок Origin на целевой URL
				rewrite: (path) => path.replace(/^\/api/, ''), // Убирает префикс /api из пути
			},
		},
	},
	//   server: {
	//     open: true,
	//     proxy: {
	//       "/base": {
	//         target: "http://localhost:19000",
	//         changeOrigin: true,
	//         rewrite: (path) => path.replace(/^\/base/, ""),
	//       },
	//     },
	//   },
	cacheDir: './.vite', // Укажите путь для кэша
	publicDir: "source/static/",
	build: {
		outDir: "./public",

		chunkSizeWarningLimit: 1000, // Увеличение лимита предупреждения о размере чанка

		//copyPublicDir: false, // устраняет ошибку The public directory feature may not work correctly. outDir __ and publicDir __ are not separate folders.

		assetsDir: "", // Leave `assetsDir` empty so that all static resources are placed in the root of the `dist` folder.
		optimizeDeps: {
			include: ["your-dependency-name"], // Замените на ваши зависимости
		},
		assetsInlineLimit: 0,

		rollupOptions: {
			input: {
				// eslint-disable-next-line no-undef
				main: resolve(__dirname, "index.html"),
			},

			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						return "n-modules"; // Все зависимости из node_modules будут в одном чанке
					}
					//if (id.includes('src/components')) { // Другие условия для создания чанков
					//  return 'components'; // Все компоненты будут в одном чанке с именем 'components'
					//}
				},

				//scripts/[name]-[hash].js
				entryFileNames: "scripts/script-[name].js", // If you need a specific file name, comment out - scripts/script-[hash].js
				chunkFileNames: "scripts/script-[name].js", // these lines and uncomment the bottom ones
				// entryFileNames: chunk => { // Позволяет контролировать, как будут называться выходные файлы для ваших чанков
				//     if (chunk.name === 'main') {
				//         return 'js/main.min.js';
				//     } else if (chunk.name.startsWith('vendor')) {
				//         return 'js/vendor-[name].min.js'; // Например, для библиотек
				//     }
				//     return `js/[name].min.js`; // Для остальных чанков
				// },

				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split(".");
					const extType = info[info.length - 1];
					if (/\.(png|jpe?g|gif|svg|webp|webm|tiff|bmp|ico)$/.test(assetInfo.name)) {
						return `images/[name].${extType}`;
					}
					if (/\.(css)$/.test(assetInfo.name)) {
						return `css/styles-[name].${extType}`;
					}
					if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
						return `fonts/[name].${extType}`;
					}
					return `[name].${extType}`;
				},
			},
		},
	}
});
