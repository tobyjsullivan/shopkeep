console.log('editor.js loaded');

const state = {
  selecting: true,
  modalSaveCallback: () => {},
};
const elementMap = {};

function handleMouseOver(e) {
  const $el = e.target;
  if (isInternal($el)) {
    return;
  }
  const uniqueId = $el.getAttribute("data-shopkeep-id");
  console.info("Moused over: %o", uniqueId);
  if (!state.selecting) {
    return;
  }
  $el.classList.add("shopkeep-selected");
}

function handleMouseOut(e) {
  const $el = e.target;
  if (isInternal($el)) {
    return;
  }
  $el.classList.remove("shopkeep-selected");
}

function handleClick(e) {
  if (!state.selecting) {
    return;
  }

  const $el = e.target;
  if (isInternal($el)) {
    return;
  }
  var content = ""; // $el.innerText;
  for (const childNode of $el.childNodes) {
    if (childNode.nodeName === "#text") {
      content = childNode.nodeValue;
    }
  }
  if (content !== "") {
    setupModal(content, (newContent) => {
      $el.innerText = newContent;
      hideModal();
    });
    showModal();
  }
  e.stopPropagation();
  e.preventDefault();
}

function handleMutationObserved(mutationsList, observer) {
  for (const mutation of mutationsList) {
    console.info("Mutation observed %o", mutation);
    window.lastMutation = mutation;

    for (const $added of mutation.addedNodes) {
      deepInstall($added);
    }
  }
}

function deepInstall($el) {
  if (isInternal($el)) {
    return;
  }
  $el.addEventListener('mouseover', handleMouseOver);
  $el.addEventListener('mouseout', handleMouseOut);
  $el.addEventListener('click', handleClick);
  const className = $el.className;
  var index = 0;
  if (elementMap[className] !== undefined) {
    index = elementMap[className].length;
  } else {
    elementMap[className] = [];
  }
  const uniqueId = `${className}[${index}]`;
  elementMap[className].push($el);
  $el.setAttribute("data-shopkeep-id", uniqueId);

  console.debug("Installed on %s", uniqueId);

  for (const $child of $el.children) {
    deepInstall($child);
  }
}

function setupModal(content, saveCallback) {
  const $modalInput = document.getElementById("shopkeep-text-input");
  $modalInput.value = content;

  state.modalSaveCallback = saveCallback;
}

function showModal() {
  const $modal = document.getElementById("shopkeep-modal");
  $modal.classList.add("shopkeep-modal-show");
}

function hideModal() {
  const $modal = document.getElementById("shopkeep-modal");
  $modal.classList.remove("shopkeep-modal-show");
}

function markInternal($el) {
  $el.setAttribute("data-shopkeep-internal", "true");
}

function isInternal($el) {
  if ($el.getAttribute("data-shopkeep-internal") === "true") {
    return true;
  }

  return false;
}

function addTextPrompt($parent) {
  const $modal = document.createElement('div');
  markInternal($modal);
  $modal.setAttribute("id", "shopkeep-modal");
  $modal.classList.add('shopkeep-modal');

  const $text = document.createElement('p');
  markInternal($text);
  $text.innerText = "Update text:";
  const $input = document.createElement('input');
  markInternal($input);
  $input.setAttribute("id", "shopkeep-text-input");

  const $save = document.createElement('button');
  markInternal($save);
  $save.addEventListener('click', () => {
    if (state.modalSaveCallback !== undefined) {
      state.modalSaveCallback($input.value);
    }
  });
  $save.innerText = "Save";

  $modal.appendChild($text);
  $modal.appendChild($input);
  $modal.appendChild($save);

  $parent.appendChild($modal);
}

function install() {
  const $head = document.getElementsByTagName('head')[0];
  const $style = document.createElement('style');
  markInternal($style);
  $style.setAttribute('type', 'text/css');
  $style.innerHTML = `
    .shopkeep-selected {
      box-sizing: border-box;
      border: 1px solid blue;
    }

    .shopkeep-modal {
      display: none;
      position: absolute;
      left: calc(50vw - 150px);
      top: calc(50vh - 100px);
      width: 300px;
      height: 200px;
      background-color: #ffffff;
    }

    .shopkeep-modal-show {
      display: block;
    }
  `;
  $head.appendChild($style);

  const $body = document.getElementsByTagName('body')[0];
  addTextPrompt($body);
  deepInstall($body);

  // Listen for new nodes being added by competing JS
  const observer = new MutationObserver(handleMutationObserved);
  observer.observe($body, {subtree: true, childList: true});
}

install();
