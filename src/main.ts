import './style.css'
import './slider.css'

const genTitle = document.getElementById('genTitle') as HTMLHeadingElement
const drawBoard = document.getElementById('board') as HTMLDivElement
const sizeSlider = document.getElementById('range') as HTMLInputElement
const randomBtn = document.getElementById('fillRandom') as HTMLButtonElement
const fillColor = document.getElementById('fillColor') as HTMLButtonElement
const fillBucketBtn = document.getElementById('fillBucket') as HTMLButtonElement
const fillBucketText = document.getElementById('fillBucketText') as HTMLParagraphElement
const toggleBWBtn = document.getElementById('toggleBW') as HTMLDivElement
const toggleBWText = document.getElementById('toggleBWText') as HTMLParagraphElement
const clearBtn = document.getElementById('clear') as HTMLButtonElement
const startBtn = document.getElementById('start') as HTMLButtonElement
const colorPicker = document.getElementById('color') as HTMLInputElement

const startingElements = [toggleBWBtn, fillColor, randomBtn, clearBtn, fillBucketText, startBtn, fillBucketBtn, colorPicker]

const previousBtn = document.getElementById('prev') as HTMLButtonElement
const resetBtn = document.getElementById('reset') as HTMLButtonElement
const nextBtn = document.getElementById('next') as HTMLButtonElement
const playBtn = document.getElementById('play') as HTMLButtonElement
const reverseBtn = document.getElementById('reverse') as HTMLButtonElement
const pauseBtn = document.getElementById('pause') as HTMLButtonElement
const stopBtn = document.getElementById('stop') as HTMLButtonElement

const secondElements = [previousBtn, resetBtn, nextBtn, playBtn, reverseBtn, pauseBtn, stopBtn, genTitle]

const modalBackground = document.getElementById('modalBackground') as HTMLDivElement
const addRuleBtn = document.getElementById('addRuleBtn') as HTMLButtonElement
const ruleSection = document.getElementById('ruleSection') as HTMLSelectElement
// const settingModal = document.getElementById('settingModal') as HTMLDivElement
// const settingModalText = document.getElementById('settingModalText') as HTMLParagraphElement

const stopMsg = document.getElementById('stopMsg') as HTMLParagraphElement
const up = document.getElementById('up') as HTMLElement & SVGElement
const down = document.getElementById('down') as HTMLElement & SVGElement
const range = document.getElementById('range') as HTMLInputElement
const bubble = document.querySelector('#bubble') as HTMLOutputElement
const rangeWrap = document.getElementById('rangeWrap') as HTMLDivElement
// const deadAliveBtn = document.querySelectorAll('.deadAlive') as NodeListOf<Element>

const arrayAllEqual = (arr: number[]) => {
	let isEqual = true
	const firstEl = arr[0]
	arr.forEach(element => {
		if (element !== firstEl) {
			isEqual = false
			return
		}
	})
	return isEqual
}
class Canvas {
	static canvas = document.querySelector('canvas') as HTMLCanvasElement
	static ctx = Canvas.canvas.getContext('2d') as CanvasRenderingContext2D
	static renderCanvas = () => {
		for (let row = 0; row < board.grid.length; row++) {
			for (let col = 0; col < board.grid[0].length; col++) {
				const cell = board.grid[row][col]
				const size = drawBoard.clientWidth / sideLengthCells
				Canvas.ctx.beginPath()
				Canvas.ctx.rect(col * size, row * size, size, size)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				let numNeighbours = 0
				let h = 0,
					l = 0
				// let s = 0
				for (let i = -1; i < 2; i++) {
					for (let j = -1; j < 2; j++) {
						// skip if the cell selected is the middle
						if (i === 0 && j === 0) continue
						const x = row + i,
							y = col + j
						if (x >= 0 && y >= 0 && x < sideLengthCells && y < sideLengthCells) {
							// eslint-disable-next-line @typescript-eslint/ban-ts-comment
							// @ts-ignore
							// eslint-disable-next-line @typescript-eslint/no-unused-vars
							numNeighbours += board.grid[x][y]
							if (board.grid[x][y] === Board.alive) {
								const location: number = x * sideLengthCells + y
								const place = document.getElementById(String(location)) as HTMLDivElement
								const raw = place.style.backgroundColor
								if (String(raw) !== undefined) {
									const hslArr = RGBToHSL(String(raw))
									h += hslArr[0]
									// s += sr
									l += hslArr[2]
								}
							}
						}
					}
				}
				// if the generation is greater than 2 and the the cell is a child
				// average hue of parents
				const place = document.getElementById(String(row * sideLengthCells + col)) as HTMLDivElement
				const raw = place.style.backgroundColor
				const currentRgb = getRgbDataFromString(raw)
				if (cell === Board.alive) {
					if (generation <= 1) {
						const [h, s, l] = getColorValueFromIndex(row * sideLengthCells + col)
						Canvas.ctx.fillStyle = hslString(h, s, l)
					} else if (generation > 1) {
						// grayscale
						if (arrayAllEqual(currentRgb)) Canvas.ctx.fillStyle = hslString(0, 0, l)
						else Canvas.ctx.fillStyle = hslString(h, 100, 50)
					}
				} else if (cell === Board.dead) Canvas.ctx.fillStyle = 'white'
				Canvas.ctx.fill()
			}
		}
	}

	static clearCanvas = () => {
		Canvas.ctx.clearRect(0, 0, Number(Canvas.canvas.width), Number(Canvas.canvas.height))
		Canvas.renderCanvas()
	}
}

class Calculations {
	static calculateNextGeneration = (grid: number[][]) => {
		const gridCopy = grid.map((arr: number[]) => [...arr])
		for (let row = 0; row < grid.length; row++) {
			for (let col = 0; col < grid[row].length; col++) {
				const oldCell = grid[row][col]
				let numNeighbours = 0
				for (let i = -1; i < 2; i++) {
					for (let j = -1; j < 2; j++) {
						// skip if selected cell is the middle
						if (i === 0 && j === 0) continue
						const x = row + i,
							y = col + j
						if (x >= 0 && y >= 0 && x < sideLengthCells && y < sideLengthCells) numNeighbours += grid[x][y]
					}
				}
				// rules
				if (oldCell === 1 && numNeighbours < 2) gridCopy[row][col] = Board.dead
				else if (oldCell === 1 && numNeighbours > 3) gridCopy[row][col] = Board.dead
				else if (oldCell === 0 && numNeighbours === 3) gridCopy[row][col] = Board.alive
			}
		}
		return gridCopy
	}
}

class Board extends Calculations {
	static colors = {
		dark: '#15171c',
		light: 'white',
		draw: colorPicker.value,
	}
	static dead = 0
	static alive = 1
	static makeBoardArray = (size: number): number[][] => new Array(size).fill(this.dead).map(() => new Array(size).fill(this.dead))
	grid: number[][]
	constructor(size: number) {
		super()
		this.grid = Board.makeBoardArray(size)
	}
}

const sliderMax = Number(sizeSlider.getAttribute('max'))

const PreviousGens: number[][][] = []
let fillBucketActive = false
let fillBucketInfo: number
let sideLengthCells = 8
// false : color; true: black and white
let blackWhite = false
// true = draw; false = erase;
let isDragging = false
let modalActive = false
let reversing = false
let playing = false
let stopped = false
let drawMode = true
let started = false
let generation = 0
const board = new Board(sideLengthCells)

// ------Pan and zoom section----------------

const centerDiv = document.querySelector('#center') as HTMLDivElement
const divBoard = document.querySelector('#board') as HTMLDivElement
const centerDivSize = centerDiv.getBoundingClientRect()

let panningAllowed = false
let zoomFactor = 1

const translate = { scale: zoomFactor, translateX: 0, translateY: 0 }
const pinnedMousePosition = { x: 0, y: 0 }
const initialContentsPos = { x: 0, y: 0 }
const mousePosition = { x: 0, y: 0 }

const update = () => {
	divBoard.style.transform = `matrix(${translate.scale},0,0,${translate.scale},${translate.translateX},${translate.translateY})`
}

centerDiv.addEventListener('wheel', (event: WheelEvent) => {
	// Determine before anything else. Otherwise weird jumping.
	if (zoomFactor + event.deltaY / 5000 > 3 || zoomFactor + event.deltaY / 5000 < 0.4) return

	const oldZoomFactor = zoomFactor
	zoomFactor += event.deltaY / 5000

	mousePosition.x = event.clientX - centerDivSize.x
	mousePosition.y = event.clientY - centerDivSize.y

	// Calculations
	translate.scale = zoomFactor

	const contentMousePosX = mousePosition.x - translate.translateX
	const contentMousePosY = mousePosition.y - translate.translateY
	const x = mousePosition.x - contentMousePosX * (zoomFactor / oldZoomFactor)
	const y = mousePosition.y - contentMousePosY * (zoomFactor / oldZoomFactor)

	translate.translateX = x
	translate.translateY = y

	update()
})
centerDiv.addEventListener('mousedown', (event: MouseEvent) => {
	if (event.button !== 1) return
	initialContentsPos.x = translate.translateX
	initialContentsPos.y = translate.translateY
	pinnedMousePosition.x = event.clientX
	pinnedMousePosition.y = event.clientY
	panningAllowed = true
})
centerDiv.addEventListener('mousemove', (event: MouseEvent) => {
	mousePosition.x = event.clientX
	mousePosition.y = event.clientY
	if (panningAllowed) {
		const diffX = mousePosition.x - pinnedMousePosition.x
		const diffY = mousePosition.y - pinnedMousePosition.y
		translate.translateX = initialContentsPos.x + diffX
		translate.translateY = initialContentsPos.y + diffY
	}
	update()
})
centerDiv.addEventListener('mouseup', () => (panningAllowed = false))

// -----------------------------------

const getRowCol = (index: number) => {
	const row = Math.floor(index / sideLengthCells)
	const col = index % sideLengthCells
	return [row, col]
}

const changeValueAtIndex = (index: number | string, matrix: number[][], value: number) => {
	index = Number(index)
	const row = Math.floor(index / sideLengthCells)
	const col = index % sideLengthCells
	matrix[row][col] = value
}

const getRgbDataFromString = (rgb: string) =>
	rgb
		.substring(4, rgb.length - 1)
		.replace(/ /g, '')
		.split(',')
		.map((item: string) => {
			return parseInt(item)
		})

const RGBToHSL = (raw: string) => {
	const rgb = getRgbDataFromString(raw)
	const r = rgb[0] / 255
	const g = rgb[1] / 255
	const b = rgb[2] / 255
	const l = Math.max(r, g, b)
	const s = l - Math.min(r, g, b)
	const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0
	return [60 * h < 0 ? 60 * h + 360 : 60 * h, 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0), (100 * (2 * l - s)) / 2]
}

const hslString = (h: number, s: number, l: number) => String(`hsl(${h}, ${s}%, ${l}%)`)

const changeStylesSliderLarge = () => {
	drawBoard.style.transition = 'gap 0ms ease-in-out'
	drawBoard.style.gap = '0px'
	;(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.borderRadius = '0%'
		element.style.outline = 'solid black 1px'
	})
}

const changeStylesSliderSmall = () => {
	drawBoard.style.transition = 'gap 0ms ease-in-out'
	drawBoard.style.gap = '3px'
	;(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.borderRadius = '10%'
		element.style.outline = 'solid black 0px'
	})
}

const changeStyleCanvas = (gap: string, borderRadius: string, display1: string, display2: string) => {
	drawBoard.style.gap = gap
	;(document.querySelectorAll('.place') as NodeListOf<HTMLDivElement>).forEach(element => {
		element.style.borderRadius = borderRadius
		element.style.display = display1
	})
	Canvas.canvas.style.display = display2
}

const changeStylesFromCanvas = () => changeStyleCanvas('3px', '10%', 'initial', 'none')

const changeStylesToCanvas = () => changeStyleCanvas('1px', '0%', 'none', 'initial')

const setBubble = (range: HTMLInputElement, bubble: HTMLOutputElement) => {
	const val = Number(range.value)
	const min = Number(range.min || 0)
	const max = Number(range.max || 100)
	const offset = Number(((val - min) * 100) / (max - min))
	bubble.innerText = String(val)
	// yes, 14px is a magic number
	bubble.style.left = `calc(${offset}% - 14px)`
}

const hoverEffect = () => {
	changeBoardSize(sideLengthCells)
	rangeWrap.classList.add('hover')
	let timer
	if (timer) {
		// RESET THE TIMER IN EVERY CLICK
		clearTimeout(timer)
		timer = null
	}
	timer = setTimeout(() => {
		rangeWrap.classList.remove('hover')
	}, 1500)
	range.stepUp()
	setBubble(range, bubble)
}

const setGeneration = (value: number) => {
	generation = value
	genTitle.innerText = `Generation : ${generation}`
}

const stopSimulation = () => {
	stopped = false
	stopMsg.style.display = 'none'
	Canvas.clearCanvas()
	started = false
	populate()
	changeStylesFromCanvas()
	if (sideLengthCells >= 20) changeStylesSliderLarge()
	if (sideLengthCells <= 20) changeStylesSliderSmall()
	startingElements.forEach(element => (element.style.display = 'initial'))
	secondElements.forEach(element => (element.style.display = 'none'))
	stopMsg.style.display = 'none'
}

const start = () => {
	PreviousGens.push(board.grid)
	Canvas.renderCanvas()
	changeStylesToCanvas()
	startingElements.forEach(element => (element.style.display = 'none'))
	secondElements.forEach(element => (element.style.display = 'initial'))
}

const checkEqualValueMatrix = (matrix1: number[][], matrix2: number[][], matrix3: number[][]) => {
	if (matrix1 === undefined && matrix2 === undefined && matrix3 === undefined) return
	let isEqual = true
	for (let row = 0; row < matrix1.length; row++) {
		for (let col = 0; col < matrix1[0].length; col++) {
			if (matrix1[row][col] !== matrix2[row][col] && matrix1[row][col] !== matrix3[row][col]) {
				isEqual = false
				break
			}
		}
	}
	return isEqual
}

const checkForStop = () => {
	if (generation <= 3) return
	if (checkEqualValueMatrix(board.grid, PreviousGens[PreviousGens.length - 2], PreviousGens[PreviousGens.length - 3])) {
		stopMsg.style.display = 'initial'
		reversing = false
		playing = false
		stopped = true
	}
}

const fillRandom = () => {
	const colorsOfTheRainbow = [0, 27, 60, 120, 240, 300]
	let count = 0
	for (let row = 0; row < board.grid.length; row++) {
		for (let col = 0; col < board.grid[0].length; col++) {
			const div = document.getElementById(String(count)) as HTMLDivElement
			// randomly making board cell dead or alive
			board.grid[row][col] = Math.round(Math.random())
			if (board.grid[row][col] === Board.alive) {
				if (blackWhite) div.style.backgroundColor = hslString(0, 0, 0)
				else if (!blackWhite) div.style.backgroundColor = hslString(colorsOfTheRainbow[Math.floor(Math.random() * 6)], 100, 50)
			} else if (board.grid[row][col] === Board.dead) div.style.backgroundColor = 'white'
			count++
		}
	}
}

const fillBoard = () => {
	let count = 0
	for (let row = 0; row < board.grid.length; row++) {
		for (let col = 0; col < board.grid[0].length; col++) {
			const div = document.getElementById(String(count)) as HTMLDivElement
			div.style.backgroundColor = Board.colors.draw
			board.grid[row][col] = Board.alive
			count++
		}
	}
}

const fillEmpty = () => {
	let count = 0
	const element = document.getElementById(String(fillBucketInfo)) as HTMLDivElement
	const color = element.style.backgroundColor
	for (let row = 0; row < board.grid.length; row++) {
		for (let col = 0; col < board.grid[0].length; col++) {
			if (document.getElementById(String(count))?.style.backgroundColor === color) {
				const div = document.getElementById(String(count)) as HTMLDivElement
				div.style.backgroundColor = Board.colors.draw
				board.grid[row][col] = Board.alive
			}
			count++
		}
	}
}

const changeBoardSize = (size: number) => {
	sideLengthCells = size
	board.grid = Board.makeBoardArray(sideLengthCells)
	populate()
	drawBoard.style.gridTemplateRows = `repeat(${sideLengthCells}, 1fr)`
	drawBoard.style.gridTemplateColumns = `repeat(${sideLengthCells}, 1fr)`
}

const getColorValueFromIndex = (id: number) => RGBToHSL(String(document.getElementById(String(id))?.style.backgroundColor))

const reset = () => {
	//resting all values to default
	stopMsg.style.display = 'none'
	isDragging = false
	playing = false
	drawMode = true
	board.grid = Board.makeBoardArray(sideLengthCells)
	setGeneration(0)
	Canvas.clearCanvas()
}
const pause = () => {
	reversing = false
	playing = false
}

const play = () => {
	const gameLoop = setTimeout(() => {
		next()
		requestAnimationFrame(play)
	}, 50)
	if (!playing || reversing) clearTimeout(gameLoop)
}

const reverse = () => {
	const reverseLoop = setTimeout(() => {
		prev()
		requestAnimationFrame(reverse)
	}, 50)
	// speed
	if (!reversing || playing) clearTimeout(reverseLoop)
}

const prev = () => {
	stopMsg.style.display = 'none'
	stopped = false
	if (!(Number(PreviousGens.length) >= 0)) return
	if (PreviousGens.length >= 2 && generation >= 1) {
		board.grid = PreviousGens[PreviousGens.length - 2]
		setGeneration(generation - 1)
	} else if (PreviousGens.length === 1 && generation >= 1) {
		board.grid = PreviousGens[PreviousGens.length - 1]
		setGeneration(generation - 1)
	}
	PreviousGens.pop()
	Canvas.renderCanvas()
}

const next = () => {
	board.grid = Board.calculateNextGeneration(board.grid)
	Canvas.renderCanvas()
	setGeneration(generation + 1)
	PreviousGens.push(board.grid)
	checkForStop()
}

const clearBoard = () => {
	board.grid = Board.makeBoardArray(sideLengthCells)
	;(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => (element.style.backgroundColor = 'white'))
}

const checkColor = (row: number, col: number, div: HTMLDivElement) => {
	div.style.backgroundColor = board.grid[row][col] ? Board.colors.draw : Board.colors.light
}

const bounceAnim = (div: HTMLDivElement) => {
	div.classList.add('bounceAnim')
	setTimeout(() => {
		div.classList.remove('bounceAnim')
	}, 300)
}

const populate = () => {
	drawBoard.innerHTML = ''
	let count = 0
	for (let row = 0; row < board.grid.length; row++) {
		for (let col = 0; col < board.grid[0].length; col++) {
			// setup element
			const div = document.createElement('div')
			div.id = String(count)
			div.className = 'place'
			// check if place should be black or white
			checkColor(row, col, div)
			div.addEventListener('click', () => {
				if (drawMode) {
					changeValueAtIndex(div.id, board.grid, 1)
					bounceAnim(div)
				} else {
					if (!fillBucketActive) changeValueAtIndex(div.id, board.grid, 0)
					if (fillBucketActive) fillBucketActive = false
					bounceAnim(div)
				}
				checkColor(row, col, div)
			})
			drawBoard.appendChild(div)
			count++
		}
	}
}

window.addEventListener('load', () => {
	Canvas.ctx.canvas.width = drawBoard.clientWidth
	Canvas.ctx.canvas.height = drawBoard.clientHeight
	setBubble(range, bubble)

	populate()
})

window.addEventListener('mousedown', event => {
	const target = event.target as HTMLDivElement
	fillBucketInfo = Number(target.id)
	if (target.className !== 'place') return
	const [row, col] = getRowCol(Number(target.id))
	drawMode = board.grid[row][col] === Board.dead
	if (event.button === 0) isDragging = true
	if (fillBucketActive) {
		fillBucketText.style.color = 'red'
		fillEmpty()
	}
})

window.addEventListener('mousemove', event => {
	const target = event.target as HTMLDivElement
	const id = target.id
	const div = document.getElementById(String(id)) as HTMLDivElement
	const [row, col] = getRowCol(Number(id))
	if (!isDragging) return
	if (drawMode) {
		changeValueAtIndex(id, board.grid, 1)
		bounceAnim(div)
	} else {
		changeValueAtIndex(id, board.grid, 0)
		bounceAnim(div)
	}
	checkColor(row, col, div)
})

window.addEventListener('mouseup', () => (isDragging = false))

window.addEventListener('click', event => {
	const target = event.target as HTMLButtonElement
	if (target.className !== 'deadAlive') return
	const child = target.firstChild as HTMLParagraphElement
	if (child.innerText === 'Dead') target.innerHTML = '<p>Alive</p>'
	if (child.innerText === 'Alive') target.innerHTML = '<p>Dead</p>'
})

toggleBWBtn.addEventListener('click', () => {
	blackWhite = !blackWhite
	toggleBWText.innerText = blackWhite ? 'Toggle Color' : 'Toggle B/W'
	if (!blackWhite) {
		toggleBWText.style.color = 'black'
		toggleBWText.classList.remove('rainbow')
	} else if (blackWhite) toggleBWText.classList.add('rainbow')
	blackWhite ? startingElements.pop() : startingElements.push(colorPicker)
	colorPicker.style.display = blackWhite ? 'none' : 'initial'
	Board.colors.draw = blackWhite ? 'black' : colorPicker.value
	let count = 0
	for (let row = 0; row < board.grid.length; row++) {
		for (let col = 0; col < board.grid[0].length; col++) {
			const div = document.getElementById(String(count)) as HTMLDivElement
			checkColor(row, col, div)
			count++
		}
	}
})

colorPicker.addEventListener('input', () => (Board.colors.draw = colorPicker.value))

// hasReset = true
resetBtn.addEventListener('click', () => reset())

reverseBtn.addEventListener('click', () => {
	if (generation >= 1) {
		reversing = true
		playing = false
		reverse()
	}
})

playBtn.addEventListener('click', () => {
	if (!stopped) {
		reversing = false
		playing = true
		play()
	}
})

window.addEventListener('keydown', event => {
	if (event.key === ' ' && started) {
		if (!playing) {
			if (!stopped) {
				reversing = false
				playing = true
				play()
			}
		} else {
			reversing = false
			playing = false
		}
	}

	if (event.key === 'ArrowLeft' && generation >= 1 && !reversing) {
		prev()
	}
	if (event.key === 'ArrowRight' && !playing) {
		next()
	}
	if (event.key === 'Escape') {
		modalActive = !modalActive
		modalBackground.style.display = modalActive ? 'initial' : 'none'
	}
})

addRuleBtn.addEventListener('click', () => {
	const rule = document.createElement('div')
	rule.className = 'rule'
	rule.innerHTML = `<div class="ruleLeft ruleRightLeft">
	<p>If</p>
	<button class="deadAlive"><p>Dead</p></button>
</div>
<div class="ruleMiddle">
	<div class="middleLeft">
		<p>And Neighbors</p>
	</div>
	<div class="ruleInput">
		<div class="inputSec great">
			<div class="labelWrap">
				<label for="great"> >  </label>
			</div>
			<input name="great" type="text" />
		</div>
		<div class="inputSec less">
			<div class="labelWrap">
				<label for="less"> &#60 </label>
			</div>
			<input name="less" type="text" />
		</div>
		<div class="inputSec equal">
			<div class="labelWrap">
				<label for="equal"> = </label>
			</div>
			<input name="equal" type="text" />
		</div>
	</div>
</div>
<div class="ruleRight ruleRightLeft">
	<p>Then</p>
	<button class="deadAlive"><p>Dead</p></button>
</div>`

	ruleSection.appendChild(rule)
	ruleSection.scrollTop = ruleSection.scrollHeight
})

pauseBtn.addEventListener('click', () => pause())

stopBtn.addEventListener('click', () => stopSimulation())

startBtn.addEventListener('click', () => {
	stopped = false
	started = true
	start()
})

previousBtn.addEventListener('click', () => {
	if (generation >= 1 && !reversing) prev()
})

nextBtn.addEventListener('click', () => {
	if (!playing) next()
})

randomBtn.addEventListener('click', () => fillRandom())

fillColor.addEventListener('click', () => fillBoard())

fillBucketBtn.addEventListener('click', () => {
	fillBucketActive = true
	fillBucketText.style.color = 'green'
})

clearBtn.addEventListener('click', () => clearBoard())

sizeSlider.addEventListener('change', e => {
	const event = e.target as HTMLInputElement
	const eventValue = Number(event.value)
	changeBoardSize(eventValue)
	if (eventValue >= 20) changeStylesSliderLarge()
	if (eventValue <= 20) changeStylesSliderSmall()
})

range.addEventListener('input', () => setBubble(range, bubble))

up.addEventListener('click', () => {
	if (sideLengthCells + 1 <= sliderMax) {
		sideLengthCells++
		hoverEffect()
	}
})

down.addEventListener('click', () => {
	if (sideLengthCells - 1 >= sliderMax) {
		sideLengthCells--
		hoverEffect()
	}
})
