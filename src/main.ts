import './style.css';

// Getting all elements from the dom
const generationTitle = document.getElementById('genTitle') as HTMLHeadingElement;
const editBoard = document.getElementById('board') as HTMLDivElement;
const sizeSlider = document.getElementById('range') as HTMLInputElement;
const fillRandomBtn = document.getElementById('fillRandom') as HTMLButtonElement;
const fillColorBtn = document.getElementById('fillColor') as HTMLButtonElement;
const fillBucketBtn = document.getElementById('fillBucket') as HTMLButtonElement;
const fillBucketText = document.getElementById('fillBucketText') as HTMLParagraphElement;
const toggleBWBtn = document.getElementById('toggleBW') as HTMLDivElement;
const toggleBWText = document.getElementById('toggleBWText') as HTMLParagraphElement;
const clearBtn = document.getElementById('clear') as HTMLButtonElement;
const startBtn = document.getElementById('start') as HTMLButtonElement;
const colorPicker = document.getElementById('color') as HTMLInputElement;
const keys = document.getElementById('keys') as HTMLParagraphElement;
const left = document.getElementById('left') as HTMLDivElement;

const startingElements = [left, toggleBWBtn, keys, fillColorBtn, fillRandomBtn, clearBtn, fillBucketText, startBtn, fillBucketBtn, colorPicker];

const previousBtn = document.getElementById('prev') as HTMLButtonElement;
const resetBtn = document.getElementById('reset') as HTMLButtonElement;
const nextBtn = document.getElementById('next') as HTMLButtonElement;
const playBtn = document.getElementById('play') as HTMLButtonElement;
const reverseBtn = document.getElementById('reverse') as HTMLButtonElement;
const pauseBtn = document.getElementById('pause') as HTMLButtonElement;
const stopBtn = document.getElementById('stop') as HTMLButtonElement;

const secondElements = [previousBtn, resetBtn, nextBtn, playBtn, reverseBtn, pauseBtn, stopBtn, generationTitle];

const modalBackground = document.getElementById('modalBackground') as HTMLDivElement;
const ruleSection = document.getElementById('ruleSection') as HTMLDivElement;
const speedInput = document.getElementById('speedInput') as HTMLInputElement;
const resetDefaultBtn = document.getElementById('resetDef') as HTMLButtonElement;

const stopMsg = document.getElementById('stopMsg') as HTMLParagraphElement;

const upSliderBtn = document.getElementById('up') as HTMLElement & SVGElement;
const downSliderBtn = document.getElementById('down') as HTMLElement & SVGElement;
const rawSlider = document.getElementById('range') as HTMLInputElement;
const rangeInfoBubble = document.querySelector('#bubble') as HTMLOutputElement;
const rangeWrap = document.getElementById('rangeWrap') as HTMLDivElement;

// initializing the canvas
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

// this is the main board class that

const colors = {
	dark: '#15171c',
	light: 'white',
	draw: colorPicker.value,
};
const dead = 0;
const alive = 1;

const sliderMax = Number(sizeSlider.getAttribute('max'));

const PreviousGens: number[][][] = [];
let canvasColors: string[][] = [];
let fillBucketActive = false;
let fillBucketInfo: number;
let speed = 50;
let sideLengthInCells = 8;
// false : color; true: black and white
let isBlackWhite = false;
let isDragging = false;
let isModalActive = false;
let isReversing = false;
let isPlaying = false;
let isStopped = false;
let isEditing = true;
// true = draw; false = erase;
let drawMode = true;
let generationNumber = 0;
let board: number[][] = [];
let rules = {
	rule1: {
		livedead: 1,
		numNeighbors: 2,
		livesDies: 0,
	},
	rule2: {
		livedead: 1,
		numNeighbors: 3,
		livesDies: 0,
	},
	rule3: {
		livedead: 0,
		numNeighbors: 3,
		livesDies: 1,
	},
};

const defaultRules = {
	rule1: {
		livedead: 1,
		numNeighbors: 2,
		livesDies: 0,
	},
	rule2: {
		livedead: 1,
		numNeighbors: 3,
		livesDies: 0,
	},
	rule3: {
		livedead: 0,
		numNeighbors: 3,
		livesDies: 1,
	},
};

// ------Pan and zoom section----------------

const centerDiv = document.querySelector('#center') as HTMLDivElement;
const centerDivSize = centerDiv.getBoundingClientRect();

let panningAllowed = false;
let zoomFactor = 1;

const translate = { scale: zoomFactor, translateX: 0, translateY: 0 };
const pinnedMousePosition = { x: 0, y: 0 };
const initialContentsPos = { x: 0, y: 0 };
const mousePosition = { x: 0, y: 0 };

const updateTransform = () => (editBoard.style.transform = `matrix(${translate.scale},0,0,${translate.scale},${translate.translateX},${translate.translateY})`);

centerDiv.addEventListener(
	'wheel',
	(event: WheelEvent) => {
		// Determine before anything else. Otherwise weird jumping.
		if (zoomFactor + event.deltaY / 1000 > 3 || zoomFactor + event.deltaY / 1000 < 0.4) return;

		const oldZoomFactor = zoomFactor;
		zoomFactor += event.deltaY / 1000;

		mousePosition.x = event.clientX - centerDivSize.x;
		mousePosition.y = event.clientY - centerDivSize.y;

		// Calculations
		translate.scale = zoomFactor;

		const contentMousePosX = mousePosition.x - translate.translateX;
		const contentMousePosY = mousePosition.y - translate.translateY;
		const x = mousePosition.x - contentMousePosX * (zoomFactor / oldZoomFactor);
		const y = mousePosition.y - contentMousePosY * (zoomFactor / oldZoomFactor);

		translate.translateX = x;
		translate.translateY = y;

		updateTransform();
	},
	{ passive: true }
);
centerDiv.addEventListener(
	'mousedown',
	(event: MouseEvent) => {
		if (event.button !== 1) return;
		initialContentsPos.x = translate.translateX;
		initialContentsPos.y = translate.translateY;
		pinnedMousePosition.x = event.clientX;
		pinnedMousePosition.y = event.clientY;
		panningAllowed = true;
	},
	{ passive: true }
);
centerDiv.addEventListener(
	'mousemove',
	(event: MouseEvent) => {
		mousePosition.x = event.clientX;
		mousePosition.y = event.clientY;
		if (panningAllowed) {
			const diffX = mousePosition.x - pinnedMousePosition.x;
			const diffY = mousePosition.y - pinnedMousePosition.y;
			translate.translateX = initialContentsPos.x + diffX;
			translate.translateY = initialContentsPos.y + diffY;
		}
		updateTransform();
	},
	{ passive: true }
);
centerDiv.addEventListener('mouseup', () => (panningAllowed = false), { passive: true });

// -----------------------------------

// the render canvas method renders all data passed to the function
const renderCanvas = () => {
	const size = editBoard.clientWidth / sideLengthInCells;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const cell = board[row][col];
			ctx.beginPath();
			ctx.rect(col * size, row * size, size, size);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			let numNeighbours = 0;
			let h = 0,
				l = 0;
			// let s = 0
			for (let i = -1; i < 2; i++) {
				for (let j = -1; j < 2; j++) {
					// skip if the cell selected is the middle
					if (i === 0 && j === 0) continue;
					const x = row + i;
					const y = col + j;
					if (x >= 0 && y >= 0 && x < sideLengthInCells && y < sideLengthInCells) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						numNeighbours += board[x][y];
						if (board[x][y] === alive) {
							const index: number = x * sideLengthInCells + y;
							const square = document.getElementById(String(index)) as HTMLDivElement;
							const rawColorData = square.style.backgroundColor;
							if (String(rawColorData) !== undefined) {
								const hslArr = RGBToHSL(String(rawColorData));
								h += hslArr[0];
								// s += sr
								l += hslArr[2];
							}
						}
					}
				}
			}
			// if the generation is greater than 2 and the the cell is a child
			// average hue of parents
			const square = document.getElementById(String(row * sideLengthInCells + col)) as HTMLDivElement;
			const rawColorData = square.style.backgroundColor;
			const currentRgb = getRgbDataFromString(rawColorData);
			// checking weather to draw the cell with avrage color or not or white for dead cells
			if (cell === alive) {
				if (generationNumber <= 1) {
					const [h, s, l] = getColorValueFromIndex(row * sideLengthInCells + col);
					ctx.fillStyle = hslString(h, s, l);
					canvasColors[row][col] = hslString(h, s, l);
				} else if (generationNumber > 1) {
					// grayscale
					if (arrayAllEqual(currentRgb)) {
						ctx.fillStyle = hslString(0, 0, l);
						canvasColors[row][col] = hslString(0, 0, l);
					} else if (!arrayAllEqual(currentRgb)) {
						ctx.fillStyle = hslString(h, 100, 50);
						canvasColors[row][col] = hslString(h, 100, 50);
					}
				}
			} else if (cell === dead) {
				ctx.fillStyle = 'white';
				canvasColors[row][col] = 'white';
			}
			ctx.fill();
			// ctx.stroke()
		}
	}
};
// clearing all contents from canvas
const clearCanvas = () => {
	ctx.clearRect(0, 0, Number(canvas.width), Number(canvas.height));
	renderCanvas();
};

// declaring the calculations subclass

//this method is passed the current grid and applies all the rules to it then returns the new generation
const calculateNextGeneration = (grid: number[][]) => {
	const gridCopy = grid.map((arr: number[]) => [...arr]);
	for (let row = 0; row < grid.length; row++) {
		for (let col = 0; col < grid[row].length; col++) {
			const oldCell = grid[row][col];
			let numNeighbours = 0;
			for (let i = -1; i < 2; i++) {
				for (let j = -1; j < 2; j++) {
					// skip if selected cell is the middle
					if (i === 0 && j === 0) continue;
					const x = row + i;
					const y = col + j;
					if (x >= 0 && y >= 0 && x < sideLengthInCells && y < sideLengthInCells) numNeighbours += grid[x][y];
				}
			}
			// rules
			if (oldCell === rules.rule1.livedead && numNeighbours < rules.rule1.numNeighbors) gridCopy[row][col] = rules.rule1.livesDies;
			else if (oldCell === rules.rule2.livedead && numNeighbours > rules.rule2.numNeighbors) gridCopy[row][col] = rules.rule2.livesDies;
			else if (oldCell === rules.rule3.livedead && numNeighbours === rules.rule3.numNeighbors) gridCopy[row][col] = rules.rule3.livesDies;
		}
	}
	return gridCopy;
};

const makeBoardArrayNumber = (size: number): number[][] => new Array(size).fill(dead).map(() => new Array(size).fill(dead));
const makeBoardArrayString = (size: number): string[][] => new Array(size).fill('').map(() => new Array(size).fill(''));

const arrayAllEqual = (arr: number[]) => {
	let isEqual = true;
	const firstEl = arr[0];
	arr.forEach(element => {
		if (element !== firstEl) {
			isEqual = false;
			return;
		}
	});
	return isEqual;
};

const getRowCol = (index: number) => {
	const row = Math.floor(index / sideLengthInCells);
	const col = index % sideLengthInCells;
	return [row, col];
};

const changeValueAtIndex = (index: number | string, matrix: number[][], value: number) => {
	index = Number(index);
	const row = Math.floor(index / sideLengthInCells);
	const col = index % sideLengthInCells;
	matrix[row][col] = value;
};

const getRgbDataFromString = (rgb: string) =>
	rgb
		.substring(4, rgb.length - 1)
		.replace(/ /g, '')
		.split(',')
		.map((item: string) => {
			return parseInt(item);
		});

const RGBToHSL = (raw: string) => {
	const rgb = getRgbDataFromString(raw);
	const r = rgb[0] / 255;
	const g = rgb[1] / 255;
	const b = rgb[2] / 255;
	const l = Math.max(r, g, b);
	const s = l - Math.min(r, g, b);
	const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0;
	return [60 * h < 0 ? 60 * h + 360 : 60 * h, 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0), (100 * (2 * l - s)) / 2];
};

const hslString = (h: number, s: number, l: number) => String(`hsl(${h}, ${s}%, ${l}%)`);

const changeStylesSliderLarge = () => {
	editBoard.style.transition = 'gap 0ms ease-in-out';
	editBoard.style.gap = '0px';
	(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.borderRadius = '0%';
		element.style.outline = 'solid black 1px';
	});
};

const changeStylesSliderSmall = () => {
	editBoard.style.transition = 'gap 0ms ease-in-out';
	editBoard.style.gap = '3px';
	(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.borderRadius = '10%';
		element.style.outline = 'solid black 0px';
	});
};

const changeStyleCanvas = (gap: string, borderRadius: string, display1: string, display2: string) => {
	editBoard.style.gap = gap;
	(document.querySelectorAll('.place') as NodeListOf<HTMLDivElement>).forEach(element => {
		element.style.borderRadius = borderRadius;
		element.style.display = display1;
	});
	canvas.style.display = display2;
};

const changeStylesFromCanvas = () => changeStyleCanvas('3px', '10%', 'initial', 'none');

const changeStylesToCanvas = () => changeStyleCanvas('1px', '0%', 'none', 'initial');

const setSliderInfoBubble = (range: HTMLInputElement, bubble: HTMLOutputElement) => {
	const val = Number(range.value);
	const min = Number(range.min || 0);
	const max = Number(range.max || 100);
	const offset = Number(((val - min) * 100) / (max - min));
	bubble.innerText = String(val);
	// yes, 14px is a magic number
	bubble.style.left = `calc(${offset}% - 14px)`;
};

const hoverEffect = () => {
	changeBoardSize(sideLengthInCells);
	rangeWrap.classList.add('hover');
	let timer;
	if (timer) {
		// RESET THE TIMER IN EVERY CLICK
		clearTimeout(timer);
		timer = null;
	}
	timer = setTimeout(() => {
		rangeWrap.classList.remove('hover');
	}, 1500);
	rawSlider.stepUp();
	setSliderInfoBubble(rawSlider, rangeInfoBubble);
};

const setGeneration = (value: number) => {
	generationNumber = value;
	generationTitle.innerText = `Generation : ${generationNumber}`;
};

const stopSimulation = () => {
	isStopped = false;
	stopMsg.style.display = 'none';
	clearCanvas();
	isEditing = true;
	populateStop();
	pause();
	changeStylesFromCanvas();
	if (sideLengthInCells >= 20) changeStylesSliderLarge();
	if (sideLengthInCells <= 20) changeStylesSliderSmall();
	startingElements.forEach(element => (element.style.display = 'initial'));
	left.style.display = 'grid';
	secondElements.forEach(element => (element.style.display = 'none'));
	stopMsg.style.display = 'none';
};

const start = () => {
	PreviousGens.push(board);
	renderCanvas();
	changeStylesToCanvas();
	startingElements.forEach(element => (element.style.display = 'none'));
	secondElements.forEach(element => (element.style.display = 'initial'));
};

const checkEqualValueMatrix = (matrix1: number[][], matrix2: number[][], matrix3: number[][]) => {
	if (matrix1 === undefined && matrix2 === undefined && matrix3 === undefined) return;
	let isEqual = true;
	for (let row = 0; row < matrix1.length; row++) {
		for (let col = 0; col < matrix1[0].length; col++) {
			if (matrix1[row][col] !== matrix2[row][col] && matrix1[row][col] !== matrix3[row][col]) {
				isEqual = false;
				break;
			}
		}
	}
	return isEqual;
};

const checkForStop = () => {
	if (generationNumber <= 3) return;
	if (checkEqualValueMatrix(board, PreviousGens[PreviousGens.length - 2], PreviousGens[PreviousGens.length - 3])) {
		stopMsg.style.display = 'initial';
		isReversing = false;
		isPlaying = false;
		isStopped = true;
	}
};

const fillRandom = () => {
	const colorsOfTheRainbow = [0, 27, 60, 120, 240, 300];
	let count = 0;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const div = document.getElementById(String(count)) as HTMLDivElement;
			board[row][col] = Math.round(Math.random());
			if (board[row][col] === alive) {
				if (isBlackWhite) div.style.backgroundColor = hslString(0, 0, 0);
				else if (!isBlackWhite) div.style.backgroundColor = hslString(colorsOfTheRainbow[Math.floor(Math.random() * 6)], 100, 50);
			} else if (board[row][col] === dead) div.style.backgroundColor = 'white';
			count++;
		}
	}
};

const fillBoard = () => {
	let count = 0;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const div = document.getElementById(String(count)) as HTMLDivElement;
			div.style.backgroundColor = colors.draw;
			board[row][col] = alive;
			count++;
		}
	}
};

const fillEmpty = () => {
	let count = 0;
	const element = document.getElementById(String(fillBucketInfo)) as HTMLDivElement;
	const color = element.style.backgroundColor;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			if (document.getElementById(String(count))?.style.backgroundColor === color) {
				const div = document.getElementById(String(count)) as HTMLDivElement;
				div.style.backgroundColor = colors.draw;
				board[row][col] = alive;
			}
			count++;
		}
	}
};

const changeBoardSize = (size: number) => {
	sideLengthInCells = size;
	board = makeBoardArrayNumber(sideLengthInCells);
	canvasColors = makeBoardArrayString(sideLengthInCells);
	populate();
	editBoard.style.gridTemplateRows = `repeat(${sideLengthInCells}, 1fr)`;
	editBoard.style.gridTemplateColumns = `repeat(${sideLengthInCells}, 1fr)`;
};

const getColorValueFromIndex = (id: number) => RGBToHSL(String(document.getElementById(String(id))?.style.backgroundColor));

const reset = () => {
	stopMsg.style.display = 'none';
	isDragging = false;
	isPlaying = false;
	drawMode = true;
	board = makeBoardArrayNumber(sideLengthInCells);
	setGeneration(0);
	clearCanvas();
};
const pause = () => {
	isReversing = false;
	isPlaying = false;
};

const play = () => {
	const gameLoop = setTimeout(() => {
		next();
		requestAnimationFrame(play);
	}, speed);
	if (!isPlaying || isReversing) clearTimeout(gameLoop);
};

const reverse = () => {
	const reverseLoop = setTimeout(() => {
		prev();
		requestAnimationFrame(reverse);
	}, speed);
	if (!isReversing || isPlaying) clearTimeout(reverseLoop);
};

const prev = () => {
	isStopped = false;
	stopMsg.style.display = 'none';
	if (!(Number(PreviousGens.length) >= 0)) return;
	if (PreviousGens.length >= 2 && generationNumber >= 1) {
		board = PreviousGens[PreviousGens.length - 2];
		setGeneration(generationNumber - 1);
	} else if (PreviousGens.length === 1 && generationNumber >= 1) {
		board = PreviousGens[PreviousGens.length - 1];
		setGeneration(generationNumber - 1);
	}
	PreviousGens.pop();
	renderCanvas();
};

const next = () => {
	board = calculateNextGeneration(board);
	renderCanvas();
	setGeneration(generationNumber + 1);
	PreviousGens.push(board);
	checkForStop();
};

const clearBoard = () => {
	board = makeBoardArrayNumber(sideLengthInCells);
	(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => (element.style.backgroundColor = 'white'));
};

const checkColor = (row: number, col: number, div: HTMLDivElement) => (div.style.backgroundColor = board[row][col] ? colors.draw : colors.light);

const checkColorStop = (row: number, col: number, div: HTMLDivElement) => (div.style.backgroundColor = canvasColors[row][col]);

const bounceAnim = (div: HTMLDivElement) => {
	div.classList.add('bounceAnim');
	div.addEventListener(
		'animationend',
		() => {
			div.classList.remove('bounceAnim');
		},
		{ once: true }
	);
};

const populate = () => {
	editBoard.innerHTML = '';
	let count = 0;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const div = document.createElement('div');
			div.id = String(count);
			div.className = 'place';
			checkColor(row, col, div);
			div.addEventListener(
				'click',
				() => {
					if (drawMode) {
						changeValueAtIndex(div.id, board, 1);
						bounceAnim(div);
					} else {
						if (!fillBucketActive) changeValueAtIndex(div.id, board, 0);
						if (fillBucketActive) fillBucketActive = false;
						bounceAnim(div);
					}
					checkColor(row, col, div);
				},
				{ passive: true }
			);
			editBoard.appendChild(div);
			count++;
		}
	}
};

const populateStop = () => {
	editBoard.innerHTML = '';
	let count = 0;
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const div = document.createElement('div');
			div.id = String(count);
			div.className = 'place';
			checkColorStop(row, col, div);
			div.addEventListener(
				'click',
				() => {
					if (drawMode) {
						changeValueAtIndex(div.id, board, 1);
						bounceAnim(div);
					} else {
						if (!fillBucketActive) changeValueAtIndex(div.id, board, 0);
						if (fillBucketActive) fillBucketActive = false;
						bounceAnim(div);
					}
					checkColorStop(row, col, div);
				},
				{ passive: true }
			);
			editBoard.appendChild(div);
			count++;
		}
	}
};

window.addEventListener(
	'load',
	() => {
		canvasColors = makeBoardArrayString(sideLengthInCells);
		ctx.canvas.height = editBoard.clientHeight;
		ctx.canvas.width = editBoard.clientWidth;
		board = makeBoardArrayNumber(sideLengthInCells);
		setSliderInfoBubble(rawSlider, rangeInfoBubble);
		populate();
	},
	{ passive: true }
);

window.addEventListener(
	'mousedown',
	event => {
		const target = event.target as HTMLDivElement;
		fillBucketInfo = Number(target.id);
		if (target.className !== 'place') return;
		const [row, col] = getRowCol(Number(target.id));
		drawMode = board[row][col] === dead;
		if (event.button === 0) isDragging = true;
		if (fillBucketActive) {
			fillBucketText.style.color = 'red';
			fillEmpty();
		}
	},
	{ passive: true }
);

window.addEventListener(
	'mousemove',
	event => {
		const target = event.target as HTMLDivElement;
		const id = target.id;
		const div = document.getElementById(String(id)) as HTMLDivElement;
		const [row, col] = getRowCol(Number(id));
		if (target.className !== 'place') return;
		if (!isDragging) return;
		if (drawMode) {
			changeValueAtIndex(id, board, 1);
			bounceAnim(div);
		} else {
			changeValueAtIndex(id, board, 0);
			bounceAnim(div);
		}
		checkColor(row, col, div);
	},
	{ passive: true }
);

window.addEventListener('mouseup', () => (isDragging = false), { passive: true });

resetDefaultBtn.addEventListener('click', () => {
	speedInput.value = String(50);
	rules = defaultRules;
	ruleSection.innerHTML = `<div class="rule">
								<p>Any</p>
								<button class="deadalive"><p>alive</p></button>
								<p>Cell With</p>
								<p>&#60;</p>
								<input
									name="neighbors"
									oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
									type="number"
									maxlength="1"
									placeholder="2"
								/>
								<p>Neighbors</p>
								<button class="diesLives deadalive"><p>Dies</p></button>
							</div>

							<div class="rule">
								<p>Any</p>
								<button class="deadalive"><p>alive</p></button>
								<p>Cell With</p>
								<p>&#62;</p>
								<input
									name="neighbors"
									oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
									type="number"
									maxlength="1"
									placeholder="3"
								/>
								<p>Neighbors</p>
								<button class="diesLives deadalive"><p>Dies</p></button>
							</div>

							<div class="rule">
								<p>Any</p>
								<button class="deadalive"><p>dead</p></button>
								<p>Cell With</p>
								<p>&#61;</p>
								<input
									name="neighbors"
									oninput="javascript: if (this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);"
									type="number"
									maxlength="1"
									placeholder="3"
								/>
								<p>Neighbors</p>
								<button class="diesLives deadalive"><p>Lives</p></button>
							</div>`;
});

window.addEventListener(
	'click',
	event => {
		const target = event.target as HTMLButtonElement;
		if (target.className === 'deadalive') {
			const child = target.firstChild as HTMLParagraphElement;
			if (child.innerText === 'dead') {
				target.innerHTML = '<p>alive</p>';
				((target.parentElement as HTMLDivElement).children[6].firstChild as HTMLParagraphElement).innerText = 'Dies';
			}
			if (child.innerText === 'alive') {
				target.innerHTML = '<p>dead</p>';
				((target.parentElement as HTMLDivElement).children[6].firstChild as HTMLParagraphElement).innerText = 'Lives';
			}
		}

		if (target.className === 'diesLives deadalive') {
			const child = target.firstChild as HTMLParagraphElement;
			if (child.innerText === 'Dies') {
				target.innerHTML = '<p>Lives</p>';
				((target.parentElement as HTMLDivElement).children[1].firstChild as HTMLParagraphElement).innerText = 'dead';
			}
			if (child.innerText === 'Lives') {
				target.innerHTML = '<p>Dies</p>';
				((target.parentElement as HTMLDivElement).children[1].firstChild as HTMLParagraphElement).innerText = 'alive';
			}
		}
	},
	{ passive: true }
);

window.addEventListener(
	'keydown',
	event => {
		if (event.key === ' ' && !isEditing) {
			if (!isPlaying && !isStopped) {
				isReversing = false;
				isPlaying = true;
				play();
			} else {
				isReversing = false;
				isPlaying = false;
			}
		}

		if (event.key === 'ArrowLeft' && generationNumber >= 1 && !isReversing && !isEditing) prev();
		if (event.key === 'ArrowRight' && !isPlaying && !isEditing && !isStopped) next();

		type ObjectKey = 'rule1' | 'rule2' | 'rule3';
		if (event.key === 'Escape') {
			isModalActive = !isModalActive;
			modalBackground.style.display = isModalActive ? 'initial' : 'none';
			if (!isModalActive) {
				try {
					speed = Number(speedInput.value || speedInput.getAttribute('placeholder'));
				} catch (error) {
					alert('please enter a number');
				}
				const rawRules = getRules(Array.from(ruleSection.children));
				let propertyName = 'rule0';
				for (let row = 0; row < rawRules.length; row++) {
					propertyName = `rule${row + 1}`;
					for (let col = 0; col < rawRules[0].length; col++) {
						rules[propertyName as ObjectKey].livedead = rawRules[row][0];
						rules[propertyName as ObjectKey].numNeighbors = rawRules[row][1];
						rules[propertyName as ObjectKey].livesDies = rawRules[row][2];
					}
				}
			}
		}
	},
	{ passive: true }
);

const getRules = (rules: Element[]) => {
	const result: number[][] = new Array(3).fill(0).map(() => new Array(3).fill(0));

	for (let i = 0; i < 3; i++) {
		if ((Array.from(rules[i].children)[1].firstChild as HTMLParagraphElement).innerText === 'alive') result[i][0] = 1;
		else result[i][0] = 0;

		const num1 = Array.from(rules[i].children)[4] as HTMLInputElement;
		result[i][1] = Number(num1.value || num1.getAttribute('placeholder'));

		if ((Array.from(rules[i].children)[6].firstChild as HTMLParagraphElement).innerText === 'Lives') result[i][2] = 1;
		else result[i][2] = 0;
	}

	return result;
};

window.addEventListener(
	'resize',
	() => {
		ctx.canvas.width = editBoard.clientWidth;
		ctx.canvas.height = editBoard.clientHeight;
		if (!isEditing) renderCanvas();
	},
	{ passive: true }
);

toggleBWBtn.addEventListener(
	'click',
	() => {
		isBlackWhite = !isBlackWhite;
		toggleBWText.innerText = isBlackWhite ? 'Toggle Color' : 'Toggle B/W';
		if (!isBlackWhite) {
			toggleBWText.style.color = 'black';
			toggleBWText.classList.remove('rainbow');
		} else if (isBlackWhite) toggleBWText.classList.add('rainbow');
		isBlackWhite ? startingElements.pop() : startingElements.push(colorPicker);
		colorPicker.style.display = isBlackWhite ? 'none' : 'initial';
		colors.draw = isBlackWhite ? '#000000' : colorPicker.value;
		let count = 0;
		for (let row = 0; row < board.length; row++) {
			for (let col = 0; col < board[0].length; col++) {
				const div = document.getElementById(String(count)) as HTMLDivElement;
				checkColor(row, col, div);
				count++;
			}
		}
	},
	{ passive: true }
);

colorPicker.addEventListener('input', () => (colors.draw = colorPicker.value), { passive: true });

// hasReset = true
resetBtn.addEventListener('click', () => reset(), { passive: true });

reverseBtn.addEventListener(
	'click',
	() => {
		if (generationNumber >= 1) {
			isReversing = true;
			isPlaying = false;
			reverse();
		}
	},
	{ passive: true }
);

playBtn.addEventListener(
	'click',
	() => {
		if (!isPlaying && !isStopped) {
			isReversing = false;
			isPlaying = true;
			play();
		}
	},
	{ passive: true }
);

pauseBtn.addEventListener('click', () => pause(), { passive: true });

stopBtn.addEventListener('click', () => stopSimulation(), { passive: true });

startBtn.addEventListener(
	'click',
	() => {
		isEditing = false;
		start();
	},
	{ passive: true }
);

previousBtn.addEventListener(
	'click',
	() => {
		if (generationNumber >= 1 && !isReversing) prev();
	},
	{ passive: true }
);

nextBtn.addEventListener(
	'click',
	() => {
		if (!isPlaying && !isStopped) next();
	},
	{ passive: true }
);

fillRandomBtn.addEventListener('click', () => fillRandom(), { passive: true });

fillColorBtn.addEventListener('click', () => fillBoard(), { passive: true });

fillBucketBtn.addEventListener(
	'click',
	() => {
		fillBucketActive = true;
		fillBucketText.style.color = 'green';
	},
	{ passive: true }
);

clearBtn.addEventListener('click', () => clearBoard(), { passive: true });

sizeSlider.addEventListener(
	'change',
	e => {
		const event = e.target as HTMLInputElement;
		const eventValue = Number(event.value);
		changeBoardSize(eventValue);
		if (eventValue >= 20) changeStylesSliderLarge();
		if (eventValue <= 20) changeStylesSliderSmall();
	},
	{ passive: true }
);

rawSlider.addEventListener('input', () => setSliderInfoBubble(rawSlider, rangeInfoBubble), { passive: true });

upSliderBtn.addEventListener(
	'click',
	() => {
		if (sideLengthInCells + 1 <= sliderMax) {
			sideLengthInCells++;
			hoverEffect();
		}
	},
	{ passive: true }
);

downSliderBtn.addEventListener(
	'click',
	() => {
		if (sideLengthInCells - 1 >= sliderMax) {
			sideLengthInCells--;
			hoverEffect();
		}
	},
	{ passive: true }
);
