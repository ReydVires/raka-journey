/// <reference path="../node_modules/phaser/types/phaser.d.ts" />

import '../src/css/index.css';
import { CONFIG } from './ts/info/GameInfo';
import { SceneList } from "./ts/info/SceneInfo";
import { ToastPlugin } from './ts/modules/plugin/ToastPlugin';

// eslint-disable-next-line no-console
if (CONFIG.ENABLE_LOG) console.log("[CONFIG]", CONFIG);

const renderType = (): number => {
	const isFirefox = /Firefox/i.test(navigator.userAgent);
	return isFirefox ? Phaser.WEBGL : Phaser.CANVAS;
};

type CalculateScreenType = {
	actualWidth: number,
	actualHeight: number,
	actualZoom: number,
	isLandscape: boolean
};
const calculateScreen = (): CalculateScreenType => {
	const targetWidth = window.innerWidth;
	const targetHeight = window.innerHeight;

	let actualWidth = targetWidth < 480 ? targetWidth * window.devicePixelRatio : targetWidth;
	let actualHeight = targetWidth < 480 ? targetHeight * window.devicePixelRatio : targetHeight;
	let actualZoom = targetWidth < 480 ? 1 / window.devicePixelRatio : 1;
	let isLandscape = targetWidth > targetHeight;

	if (isLandscape) {
		actualWidth = actualHeight * (3 / 4);
	}

	// Modulo 2 to prevent bleeding tile
	actualWidth = Math.ceil(actualWidth);
	actualHeight = Math.ceil(actualHeight);

	if (actualWidth % 2 != 0) {
		actualWidth++;
	}
	if (actualHeight % 2 != 0) {
		actualHeight++;
	}

	return {
		actualWidth,
		actualHeight,
		actualZoom,
		isLandscape
	};
};

const meta = document.createElement("meta");
meta.name = "viewport";
meta.content = "initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no";
document.head.appendChild(meta);

const screenProfile = calculateScreen();

const gameConfig: Phaser.Types.Core.GameConfig = {
	version: CONFIG.VERSION,
	banner: { hidePhaser: !CONFIG.ENABLE_LOG },
	type: renderType(),
	parent: 'game',
	backgroundColor: (CONFIG.ON_DEBUG) ? '#74b9ff' : '#181818',
	scale: {
		mode: Phaser.Scale.NONE,
		width: screenProfile.actualWidth,
		height: screenProfile.actualHeight,
		zoom: screenProfile.actualZoom,
		autoRound: true,
	},
	seed: [((+new Date()).toString(16) + (Math.random() * 100000000 | 0).toString(16))],
	plugins: {
		global: [
			{ key: "ToastPlugin", plugin: ToastPlugin, mapping: "toast" },
		]
	},
	physics: {
		default: "arcade",
		arcade: {
			gravity: { y: 0 },
			debug: CONFIG.ENABLE_PHYSICS_DEBUG,
		}
	},
	scene: SceneList(),
	input: { activePointers: 3 },
	dom: {
		createContainer: true
	},
	render: {
		antialias: true,
		pixelArt: false,
		roundPixels: false,
	},
	autoFocus: true,
};

const game = new Phaser.Game(gameConfig);

// Resize is better to be registered after loaded
window.addEventListener("load", () => {
	if (!CONFIG.AUTO_CANVAS_RESIZE) return;

	// Register resize event
	let execResize: NodeJS.Timeout;
	const resizeEndEvent = new Event('resizeEnd');
	const EXEC_DELAY = /i(Phone|Pod|Pad|OS)/.test(navigator.userAgent) ? 380 : 50;

	window.addEventListener("resize", () => {
		clearTimeout(execResize);
		execResize = setTimeout(() => window.document.dispatchEvent(resizeEndEvent), EXEC_DELAY);
	}, false);

	window.document.addEventListener("resizeEnd", (e) => {
		const { actualWidth, actualHeight, actualZoom } = calculateScreen();
		game.scale.resize(actualWidth, actualHeight);
		game.scale.setZoom(actualZoom);
	});
});
