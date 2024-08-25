const KEYBOARD_ROW_1 = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
const KEYBOARD_ROW_2 = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
const KEYBOARD_ROW_3 = ['Z', 'X', 'C', 'V', 'B', 'N', 'M']

const NUM_ROWS = 6;
const NUM_COLS = 5;

let finished = false;
let boardTiles = [];
let currRow = 0;
let currCol = 0;
let wordListWords = Array.from(WORD_LIST).sort();
let wordListHeader;
let wordListContent;

createBoard();
createKeyboard();
createWordList();


// ###### LETTER BOARD ###### //

function createBoard() {
  // Create board element
  let board = document.createElement("div");
  board.className = "board";
  // Create board rows
  for (let i = 0; i < NUM_ROWS; i++) {
    let rowTiles = [];
    let row = document.createElement("div");
    row.className = "boardRow";
    // Create row tiles 
    for (let j = 0; j < NUM_COLS; j++) {
      let tile = document.createElement("div");
      tile.classList.add("boardTile", "empty");
      tile.addEventListener("click", handleTileClick);
      tile.dataset.row = i;
      tile.dataset.col = j;
      row.append(tile);
      rowTiles.push(tile);
    }
    board.append(row);
    boardTiles.push(rowTiles);
  }
  document.getElementById("boardContainer").append(board);
}

function handleTileClick(evt) {
  if (finished) return;

  let tile = evt.target;
  if (tile.classList.contains("empty") || tile.dataset.row != currRow) {
    return
  }
  if (tile.classList.contains("absent")) {
    tile.classList.replace("absent", "present");
  }
  else if (tile.classList.contains("present")) {
    tile.classList.replace("present", "correct");
  }
  else if (tile.classList.contains("correct")) {
    tile.classList.replace("correct", "absent");
  }
}



// ################## KEYBOARD ################## //

function createKeyboard() {
  let keyboard = document.getElementById("keyboardContainer");
  keyboard.append(createKeyboardRow(KEYBOARD_ROW_1));
  keyboard.append(createKeyboardRow(KEYBOARD_ROW_2));
  // Create row 3 with special keys
  let row3 = createKeyboardRow(KEYBOARD_ROW_3);
  row3.prepend(createEnterKey());
  row3.append(createShiftKey());
  keyboard.append(row3);
  // Allow user interact with physical keyboard
  document.addEventListener("keydown", handlePhysicalKeyDown);
}

function createKeyboardRow(letters) {
  let row = document.createElement("div");
  row.className = "keyboardRow";
  for (let letter of letters) {
    let key = document.createElement("input");
    key.setAttribute("type", "button");
    key.setAttribute("value", letter);
    key.className = "keyboardKey";
    key.addEventListener("click", handleKeyClick);
    row.append(key);
  }
  return row;
}

function createEnterKey(keyValue) {
  let key = document.createElement("input");
  key.setAttribute("type", "button");
  key.setAttribute("value", "ENTER");
  key.classList.add("keyboardKey", "keyboardWideKey");
  key.addEventListener("click", handleEnter);
  return key;
}

function createShiftKey() {
  let key = document.createElement("button");
  key.innerHTML = BACKSPACE_ICON;
  key.classList.add("keyboardKey", "keyboardWideKey");
  key.addEventListener("click", handleBackspace);
  return key;
}

function handleKeyClick(evt) {
  processLetterEntry(evt.target.value);
}

function handlePhysicalKeyDown(evt) {
  function isAlpha(char) {
    return /^[a-z]$/i.test(char);
  }
  if (evt.metaKey || evt.ctrlKey || evt.altKey) {
    return;
  }
  if (isAlpha(evt.key)) {
    processLetterEntry(evt.key.toUpperCase());
  }
  else if (evt.key == "Enter") {
    handleEnter()
  }
  else if (evt.key == "Backspace") {
    handleBackspace();
  }
}

function processLetterEntry(letter) {
  if (finished) return;
  let currTile = boardTiles[currRow][currCol];
  if (currCol == NUM_COLS-1 && currTile.innerHTML) {
    return;
  }
  currTile.innerHTML = letter;
  currTile.classList.replace("empty", "absent");
  if (currCol < NUM_COLS-1) {
    currCol++;
  }
}

function handleBackspace(evt) {
  if (finished) return;
  function deleteLetter(tile) {
    tile.classList.remove("absent", "present", "correct");
    tile.classList.add("empty");
    tile.innerHTML = "";
  }
  let currTile = boardTiles[currRow][currCol];
  if (currTile.innerHTML) {
    deleteLetter(currTile);
  }
  else {
    if (currCol == 0) {
      return;
    }
    currCol--;
    currTile = boardTiles[currRow][currCol];
    deleteLetter(currTile);
  }
}

function handleEnter(evt) {
  if (finished) return;
  let currTile = boardTiles[currRow][currCol];
  if (currCol == NUM_COLS-1 && currTile.innerHTML) {
    filterWordList();
    if (currRow != NUM_ROWS-1) {
      currRow++;
      currCol = 0;
    }
    else {
      finished = true;
    }
  }
}


// ################## WORD LIST ################## //

function createWordList() {
  let wordListBox = document.createElement("div");
  wordListBox.className = "wordListBox";

  wordListHeader = document.createElement("div");
  wordListHeader.className = "wordListHeader";
  wordListBox.append(wordListHeader);

  wordListContent = document.createElement("div")
  wordListContent.className = "wordListContent";
  wordListBox.append(wordListContent);

  document.getElementById("wordListContainer").append(wordListBox);

  updateWordList();
}

function updateWordList() {
  let headerText = `${wordListWords.length}${'&nbsp;'} possible `;
  headerText += wordListWords.length == 1 ? "word" : "words";
  wordListHeader.innerHTML = headerText;

  let html = "<ul class='wordList'>"
  for (let word of wordListWords) {
    html += `<li>${word}</li>`;
  }
  html += "</ul>";
  wordListContent.innerHTML = html;
}

function filterWordList() {
  let filteredList = [];
  let letters = getWordLetters();
  for (let word of wordListWords) {
    if (!letterPositionsMatch(word, letters)){
      continue;
    }
    if (!letterPresencesMatch(word, letters)) {
      continue;
    }
    filteredList.push(word);
  }
  wordListWords = filteredList;
  updateWordList();
}

function letterPositionsMatch(word, letters) {
  word = word.toUpperCase();
  for (let i = 0; i < word.length; i++) {
    if (letters[i].state == "correct" && word[i] != letters[i].letter) {
      return false;
    }
    if (letters[i].state == "present" && word[i] == letters[i].letter) {
      return false;
    }
  }
  return true;
}

function letterPresencesMatch(word, letters) {
  word = word.toUpperCase();
  let presentLetters = [];
  let absentLetters = [];
  let correctLetters = [];
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].state == "present") {
      presentLetters.push(letters[i].letter);
    }
    else if (letters[i].state == "absent") {
      absentLetters.push(letters[i].letter);
    }
    else if (letters[i].state == "correct") {
      correctLetters.push(letters[i].letter);
    }
  }
  // Remove correct letters from word because their presence is already accounted for.
  for (let letter of correctLetters) {
    word = word.replace(letter, "");
  }
  for (let letter of presentLetters) {
    if (!word.includes(letter)) {
      return false;
    }
    word = word.replace(letter, "");
  }
  for (let letter of absentLetters) {
    if (word.includes(letter)) {
      return false;
    }
  }
  return true;
}

function getWordLetters() {
  let letters = [];
  let rowTiles = boardTiles[currRow];
  for (let tile of rowTiles) {
    let info = {};
    info["letter"] = tile.innerHTML;
    if (tile.classList.contains("absent")) {
      info["state"] = "absent";
    }
    else if (tile.classList.contains("present")) {
      info["state"] = "present";
    }
    else if (tile.classList.contains("correct")) {
      info["state"] = "correct";
    }
    letters.push(info);
  }
  return letters;
}