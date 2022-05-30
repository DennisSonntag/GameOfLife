import './style.css'
import './slider.css'

const canvas = document.querySelector('canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

const genTitle = document.getElementById('genTitle') as HTMLElement
const drawBoard = document.getElementById('board') as HTMLElement
const sizeSlider = document.getElementById('range') as HTMLElement
const randomBtn = document.getElementById('fillRandom') as HTMLElement
const clearBtn = document.getElementById('clear') as HTMLElement
const startBtn = document.getElementById('start') as HTMLElement
const colorPicker = <HTMLInputElement>document.getElementById('color')

const startingElements = [randomBtn, clearBtn, startBtn, colorPicker]

const previousBtn = document.getElementById('prev') as HTMLElement
const resetBtn = document.getElementById('reset') as HTMLElement
const nextBtn = document.getElementById('next') as HTMLElement
const playBtn = document.getElementById('play') as HTMLElement
const reverseBtn = document.getElementById('reverse') as HTMLElement
const pauseBtn = document.getElementById('pause') as HTMLElement
const stopBtn = document.getElementById('stop') as HTMLElement

const secondElements = [previousBtn, resetBtn, nextBtn, playBtn, reverseBtn, pauseBtn, stopBtn, genTitle]

const stopMsg = document.getElementById('stopMsg') as HTMLElement
const up = document.getElementById('up') as HTMLElement
const down = document.getElementById('down') as HTMLElement
const range = document.getElementById('range') as HTMLInputElement
const bubble = document.querySelector('#bubble') as HTMLOutputElement
const rangeWrap = document.getElementById('rangeWrap') as HTMLDivElement

const colors = {
	dark: '#15171c',
	light: 'white',
	draw: colorPicker.value,
}
const sliderMax = Number(sizeSlider.getAttribute('max'))

let generation = 0
let sideLengthCells = 8
let hasStopped = false
let reversing = false
let playing = false
// true = draw; false = erase;
let isDragging = false
let drawMode = true
// let simulationEnd = false
let PreviousGens: number[][][] = []

const makeBoardArray = (size: number): number[][] => {
	return new Array(size).fill(0).map(() => new Array(size).fill(0))
}
// let initialBoard = makeBoardArray(sideLengthCells)
let board = makeBoardArray(sideLengthCells)
const boardColor = makeBoardArray(sideLengthCells)

const hslString = (hue: number) => {
	return [`hsl(${hue}, 100%, 50%)`, hue]
}

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

const getValueFromIndex = (index: number) => {
	const [row, col] = getRowCol(index)
	return boardColor[row][col]
}

const RGBToHSL = (r: number, g: number, b: number) => {
	r /= 255
	g /= 255
	b /= 255
	const l = Math.max(r, g, b)
	const s = l - Math.min(r, g, b)
	const h = s ? (l === r ? (g - b) / s : l === g ? 2 + (b - r) / s : 4 + (r - g) / s) : 0
	return [60 * h < 0 ? 60 * h + 360 : 60 * h, 100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0), (100 * (2 * l - s)) / 2]
}

const changeStylesSlider = () => {
	drawBoard.style.transition = 'gap 0ms ease-in-out'
	drawBoard.style.gap = '0px'
	;(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.borderRadius = '0%'
		element.style.outline = 'solid black 1px'
	})
}

const changeStyleCanvas = (gap: string, borderRadius: string, display1: string, display2: string) => {
	drawBoard.style.gap = gap
	;(document.querySelectorAll('.place') as NodeListOf<HTMLDivElement>).forEach(element => {
		element.style.borderRadius = borderRadius
		element.style.display = display1
	})
	canvas.style.display = display2
}

const changeStylesFromCanvas = () => {
	changeStyleCanvas('3px', '10%', 'initial', 'none')
}

const changeStylesToCanvas = () => {
	changeStyleCanvas('1px', '0%', 'none', 'initial')
}

const setBubble = (range: HTMLInputElement, bubble: HTMLOutputElement) => {
	const val = Number(range.value)
	const min = Number(range.min || 0)
	const max = Number(range.max || 100)
	const offset = Number(((val - min) * 100) / (max - min))
	bubble.textContent = String(val)
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
	hasStopped = true
	setGeneration(0)
	board = PreviousGens[0]
	clearCanvas()
	changeStylesFromCanvas()
	startingElements.forEach(element => {
		element.style.display = 'initial'
	})
	secondElements.forEach(element => {
		element.style.display = 'none'
	})
	stopMsg.style.display = 'none'
}

const start = () => {
	if (hasStopped) {
		board = PreviousGens[0]
		PreviousGens = []
	}
	PreviousGens.push(board)
	renderCanvas()
	changeStylesToCanvas()
	startingElements.forEach(element => {
		element.style.display = 'none'
	})
	secondElements.forEach(element => {
		element.style.display = 'initial'
	})
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
	if (checkEqualValueMatrix(board, PreviousGens[PreviousGens.length - 2], PreviousGens[PreviousGens.length - 3])) {
		playing = false
		reversing = false
		stopMsg.style.display = 'initial'
	}
}

const fillRandom = () => {
	const colorsOfTheRainbow = [0, 27, 60, 120, 240, 300]
	let count = 0
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const div = document.getElementById(String(count))
			board[row][col] = Math.round(Math.random())
			if (board[row][col] === 1 && div != null) {
				const [randomColor, hue] = hslString(colorsOfTheRainbow[Math.floor(Math.random() * 6)])
				boardColor[row][col] = Number(hue)
				div.style.backgroundColor = String(randomColor)
			} else if (board[row][col] === 0 && div != null) div.style.backgroundColor = 'white'
			count++
		}
	}
}

const changeBoardSize = (size: number) => {
	sideLengthCells = size
	board = makeBoardArray(sideLengthCells)
	drawBoard.innerHTML = ''
	populate()
	drawBoard.style.gridTemplateRows = `repeat(${sideLengthCells}, 1fr)`
	drawBoard.style.gridTemplateColumns = `repeat(${sideLengthCells}, 1fr)`
}

const clearCanvas = () => {
	board = makeBoardArray(sideLengthCells)
	ctx.clearRect(0, 0, Number(canvas.width), Number(canvas.height))
	renderCanvas()
}

const renderCanvas = () => {
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			const cell = board[row][col]
			const size = drawBoard.clientWidth / sideLengthCells
			ctx.beginPath()
			ctx.rect(col * size, row * size, size, size)
			let numNeighbours = 0
			let hue = 0
			for (let i = -1; i < 2; i++) {
				for (let j = -1; j < 2; j++) {
					// skip if the cell selected is the middle
					if (i === 0 && j === 0) continue
					const x = row + i,
						y = col + j
					if (x >= 0 && y >= 0 && x < sideLengthCells && y < sideLengthCells) {
						numNeighbours += board[x][y]
						if (board[x][y] === 1) {
							// get index from row col
							const location = x * sideLengthCells + y
							hue += getValueFromIndex(location)
						}
					}
				}
			}
			// if the generation is greater than 2 and the the cell is a child
			// average hue of parents
			if (generation > 2 && cell === 1 && numNeighbours === 3) ctx.fillStyle = String(hslString(hue / numNeighbours)[0])
			// use default color when its the first 2 generations
			else if (generation <= 2 && cell === 1) ctx.fillStyle = String(hslString(getValueFromIndex(row * sideLengthCells + col))[0])
			// if cell is dead
			else if (cell === 0) ctx.fillStyle = 'white'
			// default black and white behavior
			// ctx.fillStyle = cell ? "black" : "white";
			ctx.fill()
		}
	}
}

const reset = () => {
	//resting all values to default
	playing = false
	drawMode = true
	isDragging = false
	setGeneration(0)
	clearCanvas()
}

const play = () => {
	const gameLoop = setTimeout(() => {
		next()
		requestAnimationFrame(play)
	}, 100)
	if (!playing || reversing) clearTimeout(gameLoop)
}

const reverse = () => {
	const reverseLoop = setTimeout(() => {
		prev()
		requestAnimationFrame(reverse)
	}, 100)
	if (!reversing || playing) clearTimeout(reverseLoop)
}

const prev = () => {
	if (!(Number(PreviousGens.length) >= 0)) return
	if (PreviousGens.length >= 2) {
		board = PreviousGens[PreviousGens.length - 2]
		setGeneration(generation - 1)
	} else if (PreviousGens.length === 1) {
		board = PreviousGens[PreviousGens.length - 1]
		setGeneration(generation - 1)
	}
	PreviousGens.pop()
	renderCanvas()
	checkForStop()
}

const next = () => {
	board = calculateNextGeneration(board)
	renderCanvas()
	setGeneration(generation + 1)
	PreviousGens.push(board)
	checkForStop()
}

const clearBoard = () => {
	board = makeBoardArray(sideLengthCells)
	;(document.querySelectorAll('.place') as NodeListOf<HTMLElement>).forEach(element => {
		element.style.backgroundColor = 'white'
	})
}

const checkColor = (row: number, col: number, div: HTMLDivElement) => {
	if (board[row][col] === 1) div.style.backgroundColor = colors.draw
	else if (board[row][col] === 0) div.style.backgroundColor = colors.light
}

const bounceAnim = (div: HTMLDivElement) => {
	div.classList.add('bounceAnim')
	setTimeout(() => {
		div.classList.remove('bounceAnim')
	}, 300)
}

const populate = () => {
	let count = 0
	for (let row = 0; row < board.length; row++) {
		for (let col = 0; col < board[0].length; col++) {
			// setup element
			const div = document.createElement('div')
			div.id = String(count)
			div.className = 'place'
			// check if place should be black or white
			checkColor(row, col, div)
			div.addEventListener('mouseover', () => {
				if (!isDragging) return
				if (drawMode) {
					changeValueAtIndex(div.id, board, 1)
					bounceAnim(div)
				} else {
					changeValueAtIndex(div.id, board, 0)
					bounceAnim(div)
				}
				checkColor(row, col, div)
			})
			div.addEventListener('click', () => {
				if (drawMode) {
					changeValueAtIndex(div.id, board, 1)
					bounceAnim(div)
				} else {
					changeValueAtIndex(div.id, board, 0)
					bounceAnim(div)
				}
				checkColor(row, col, div)
			})
			drawBoard.appendChild(div)
			count++
		}
	}
}

const calculateNextGeneration = (grid: number[][]) => {
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
					if (x >= 0 && y >= 0 && x < sideLengthCells && y < sideLengthCells) {
						numNeighbours += grid[x][y]
					}
				}
			}
			// rules
			if (oldCell === 1 && numNeighbours < 2) gridCopy[row][col] = 0
			else if (oldCell === 1 && numNeighbours > 3) gridCopy[row][col] = 0
			else if (oldCell === 0 && numNeighbours === 3) gridCopy[row][col] = 1
		}
	}
	return gridCopy
}

window.addEventListener('load', () => {
	ctx.canvas.width = drawBoard.clientWidth
	ctx.canvas.height = drawBoard.clientHeight
	setBubble(range, bubble)
	populate()
	changeBoardSize(sideLengthCells)
})
window.addEventListener('mousedown', (e: any) => {
	const event = e.target
	if (event.className !== 'place') return
	const [row, col] = getRowCol(event.id)
	drawMode = board[row][col] === 0
	isDragging = true
})
window.addEventListener('mouseup', () => {
	isDragging = false
})
colorPicker.addEventListener('input', () => {
	colors.draw = colorPicker.value
})
previousBtn.addEventListener('click', () => {
	prev()
})
resetBtn.addEventListener('click', () => {
	reset()
})
reverseBtn.addEventListener('click', () => {
	playing = false
	reversing = true
	reverse()
})
playBtn.addEventListener('click', () => {
	playing = true
	reversing = false
	play()
})
pauseBtn.addEventListener('click', () => {
	playing = false
	reversing = false
})
stopBtn.addEventListener('click', () => {
	stopSimulation()
})
startBtn.addEventListener('click', () => {
	start()
})
nextBtn.addEventListener('click', () => {
	next()
})
randomBtn.addEventListener('click', () => {
	fillRandom()
})
clearBtn.addEventListener('click', () => {
	clearBoard()
})
sizeSlider.addEventListener('change', (e: any) => {
	const event = e.target
	changeBoardSize(event.value)
	if (Number(event.value) >= 20) changeStylesSlider()
})
range.addEventListener('input', () => {
	setBubble(range, bubble)
})
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
