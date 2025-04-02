const pokemonName = document.querySelector('.pokemon__name');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonImage = document.querySelector('.pokemon__image');
const form = document.querySelector('.form');
const input = document.querySelector('.input__search');
const buttonHint = document.querySelector('.btn-hint');
const buttonRestart = document.querySelector('.btn-restart');
const hintText = document.querySelector('.hint-text');
const suggestionsList = document.querySelector('.suggestions-list');
const gameResponseBox = document.querySelector('.game-response-box');
const segment1 = document.getElementById('segment1');
const segment2 = document.getElementById('segment2');
const segment3 = document.getElementById('segment3');

let currentPokemon = null;
let hintsUsed = 0;
let attemptsLeft = 3; // Número de tentativas do jogador
let currentSelectionIndex = -1; // Controla qual item da lista está selecionado
let suggestionsActive = false; // Flag para indicar se as sugestões estão ativas
let score = 0;
let highScore = localStorage.getItem('pokedexHighScore') || 0;

function updateScoreDisplay() {
  document.getElementById('current-score').textContent = score;
  document.getElementById('high-score').textContent = highScore;
}

const fetchPokemon = async (pokemon) => {
  const APIResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
  if (APIResponse.status === 200) {
    return await APIResponse.json();
  }
  return null;
};

const maskName = (name) => {
  let maskedName = name.split('').map((char) => Math.random() > 0.5 ? char : '_').join('');
  return maskedName;
};

const getHints = (data) => {
  return [
    `Type: ${data.types.map(t => t.type.name).join(', ')}`, 
    `Name: ${maskName(data.name)}`, 
    "Revealing more of the Pokémon..."
  ];
};

// Função para atualizar a barra de vida
const updateLifeBar = () => {
  // Resetando todos os segmentos
  segment1.className = 'life-bar__segment inactive';
  segment2.className = 'life-bar__segment inactive';
  segment3.className = 'life-bar__segment inactive';
  
  // Atualizando a cor e status dos segmentos baseado nas tentativas restantes
  if (attemptsLeft >= 1) {
    segment1.className = 'life-bar__segment red';
  }
  
  if (attemptsLeft >= 2) {
    segment1.className = 'life-bar__segment yellow';
    segment2.className = 'life-bar__segment yellow';
  }
  
  if (attemptsLeft >= 3) {
    segment1.className = 'life-bar__segment green';
    segment2.className = 'life-bar__segment green';
    segment3.className = 'life-bar__segment green';
  }
};

const renderPokemon = async (pokemon) => {
  pokemonName.innerHTML = '';
  pokemonNumber.innerHTML = '';
  hintText.innerHTML = '';
  hintsUsed = 0;
  attemptsLeft = 3; // Resetando tentativas
  updateLifeBar(); // Atualiza a barra de vida segmentada
  gameResponseBox.innerHTML = '<p class="response-text">Adivinhe o Pokémon!</p>'; // Mensagem inicial
  gameResponseBox.className = 'game-response-box'; // Reseta as classes

  const data = await fetchPokemon(pokemon);

  if (data) {
    currentPokemon = data;
    pokemonImage.style.display = 'block';

    // Inicia com o sprite animado em silhueta
    const animatedSprite = data.sprites.versions['generation-v']['black-white'].animated.front_default;
    if (animatedSprite) {
      pokemonImage.src = animatedSprite;
      pokemonImage.classList.add('silhouette'); 
    } else {
      pokemonImage.src = data.sprites.front_default;
      pokemonImage.classList.add('silhouette'); 
    }
  } else {
    pokemonImage.style.display = 'none';
    gameResponseBox.innerHTML = '<p class="response-text">Pokémon não encontrado :(</p>';
  }
};

// Update function for suggestions to handle pagination
const updateSuggestions = (suggestions) => {
  suggestionsList.innerHTML = ''; // Clears previous suggestions
  
  suggestions.forEach((suggestion, index) => {
    const listItem = document.createElement('li');
    listItem.textContent = suggestion.charAt(0).toUpperCase() + suggestion.slice(1); // Capitalizes first letter
    listItem.addEventListener('click', () => {
      input.value = suggestion;
      checkAnswer(suggestion);
      suggestionsList.innerHTML = ''; // Clears suggestions after selection
      suggestionsActive = false; // Deactivates suggestions after choice
    });

    // Adds selection class for active item
    if (index === currentSelectionIndex) {
      listItem.classList.add('selected');
    }

    suggestionsList.appendChild(listItem);
  });
};

// Modificar a função checkAnswer para incluir pontuação
const checkAnswer = (playerAnswer) => {
  if (playerAnswer.toLowerCase() === currentPokemon.name.toLowerCase()) {
    // Calcular pontos com base em tentativas restantes e dicas usadas
    let pointsEarned = 100; // Base
    
    // Bônus por tentativas restantes
    pointsEarned += attemptsLeft * 50;
    
    // Redução por dicas usadas
    pointsEarned -= hintsUsed * 30;
    
    // Garantir que o mínimo é 10 pontos
    pointsEarned = Math.max(10, pointsEarned);
    
    // Adicionar ao score
    score += pointsEarned;
    
    // Atualizar high score se necessário
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pokedexHighScore', highScore);
    }
    
    // Atualizar display
    updateScoreDisplay();
    
    gameResponseBox.innerHTML = `<p class="response-text">Parabéns! O Pokémon é ${currentPokemon.name}. +${pointsEarned} pontos!</p>`;
    gameResponseBox.className = 'game-response-box correct';
    pokemonImage.classList.remove('silhouette');
    pokemonNumber.innerHTML = `#${currentPokemon.id}`;
    pokemonName.innerHTML = currentPokemon.name;
  } else {
    attemptsLeft--;
    updateLifeBar();
    
    if (attemptsLeft === 0) {
      // Game over, resetar pontuação
      score = 0;
      updateScoreDisplay();
      
      gameResponseBox.innerHTML = `<p class="response-text">Fim de jogo! Era o ${currentPokemon.name}.</p>`;
      gameResponseBox.className = 'game-response-box game-over';
      pokemonImage.classList.remove('silhouette');
      pokemonNumber.innerHTML = `#${currentPokemon.id}`;
      pokemonName.innerHTML = currentPokemon.name;
    } else {
      gameResponseBox.innerHTML = `<p class="response-text">Errado! Você tem ${attemptsLeft} tentativa${attemptsLeft > 1 ? 's' : ''}.</p>`;
      gameResponseBox.className = 'game-response-box incorrect';
    }
  }
};

// Modified keydown event to handle pagination through suggestions
input.addEventListener('keydown', (e) => {
  const items = document.querySelectorAll('.suggestions-list li');
  const maxIndex = items.length - 1;
  
  if (!window.allSuggestions || window.allSuggestions.length === 0) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault(); // Prevents cursor from moving in input field
    
    if (currentSelectionIndex < maxIndex) {
      // Move selection down within current page
      currentSelectionIndex++;
    } else {
      // Move to next page of suggestions if available
      if ((window.currentSuggestionPage + 1) * window.suggestionsPerPage < window.allSuggestions.length) {
        window.currentSuggestionPage++;
        currentSelectionIndex = 0;
        
        // Get next page of suggestions
        const startIndex = window.currentSuggestionPage * window.suggestionsPerPage;
        const endIndex = startIndex + window.suggestionsPerPage;
        const nextPageSuggestions = window.allSuggestions.slice(startIndex, endIndex);
        
        updateSuggestions(nextPageSuggestions);
        return;
      }
    }
    
    // Update the visual selection
    items.forEach((item, idx) => {
      if (idx === currentSelectionIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
  } else if (e.key === 'ArrowUp') {
    e.preventDefault(); // Prevents cursor from moving in input field
    
    if (currentSelectionIndex > 0) {
      // Move selection up within current page
      currentSelectionIndex--;
    } else if (currentSelectionIndex === 0 && window.currentSuggestionPage > 0) {
      // Move to previous page of suggestions
      window.currentSuggestionPage--;
      
      // Get previous page of suggestions
      const startIndex = window.currentSuggestionPage * window.suggestionsPerPage;
      const endIndex = startIndex + window.suggestionsPerPage;
      const prevPageSuggestions = window.allSuggestions.slice(startIndex, endIndex);
      
      updateSuggestions(prevPageSuggestions);
      currentSelectionIndex = prevPageSuggestions.length - 1;
      return;
    }
    
    // Update the visual selection
    items.forEach((item, idx) => {
      if (idx === currentSelectionIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
  } else if (e.key === 'Enter' && currentSelectionIndex >= 0 && items.length > 0) {
    e.preventDefault(); // Prevents form submission
    const selectedItem = items[currentSelectionIndex].textContent;
    input.value = selectedItem;
    checkAnswer(selectedItem);
    suggestionsList.innerHTML = ''; // Clears suggestions after selection
    suggestionsActive = false;
  }
});

// Função que será chamada ao submeter o formulário
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const answer = input.value.trim();
  if (answer !== '') {
    checkAnswer(answer);
    input.value = '';
    suggestionsList.innerHTML = '';
    suggestionsActive = false;
  }
});

// Modification for the input event listener to limit suggestions displayed
input.addEventListener('input', async () => {
  const query = input.value.toLowerCase();
  if (query.length > 1) {
    const allPokemons = await fetch('https://pokeapi.co/api/v2/pokemon?limit=898'); // Lista de todos os Pokémons
    const allPokemonsData = await allPokemons.json();
    const filteredSuggestions = allPokemonsData.results
      .filter(pokemon => pokemon.name.toLowerCase().includes(query))
      .map(pokemon => pokemon.name);
    
    // Limit the displayed suggestions to a maximum of 3 at a time
    let displaySuggestions = filteredSuggestions.slice(0, 3);
    
    // Store all suggestions for navigation
    window.allSuggestions = filteredSuggestions;
    window.currentSuggestionPage = 0;
    window.suggestionsPerPage = 3;
    
    updateSuggestions(displaySuggestions);
    suggestionsActive = filteredSuggestions.length > 0;
    currentSelectionIndex = -1; // Resetting selection when typing new text
  } else {
    suggestionsList.innerHTML = ''; // Clears the list if input is too short
    suggestionsActive = false; // Deactivates suggestions if input is too short
    window.allSuggestions = [];
  }
});

buttonHint.addEventListener('click', () => {
  if (currentPokemon) {
    const hints = getHints(currentPokemon);

    // Exibir as dicas, e caso não haja mais, balançar o botão de dica
    if (hintsUsed < hints.length) {
      hintText.innerHTML = '';  // Limpa qualquer dica anterior

      // Aplica as dicas conforme o número de dicas usadas
      if (hintsUsed === 0) { 
        pokemonNumber.innerHTML = `#${currentPokemon.id}`;
        gameResponseBox.innerHTML = `<p class="response-text">Dica: ${hints[0]}</p>`;
      } else if (hintsUsed === 1) { 
        pokemonName.innerHTML = hints[hintsUsed].replace("Name: ", "");
        document.querySelector('.pokemon__name').classList.add('hint-visible');  // Dica de nome
        gameResponseBox.innerHTML = `<p class="response-text">Dica: Nome parcialmente revelado</p>`;
      } else if (hintsUsed === 2) { 
        pokemonImage.classList.remove('silhouette');  // Revela a imagem
        gameResponseBox.innerHTML = `<p class="response-text">Dica: Revelando mais do Pokémon...</p>`;
      }

      hintsUsed++;
    }

    // Se não houver mais dicas, balança o botão de dica
    if (hintsUsed === hints.length) {
      buttonHint.classList.add('shake'); // Adiciona a classe para balançar
      setTimeout(() => {
        buttonHint.classList.remove('shake'); // Remove a classe após a animação
      }, 500); // A duração da animação é 0.5s
      gameResponseBox.innerHTML = `<p class="response-text">Sem mais dicas disponíveis!</p>`;
    }
  }
});

buttonRestart.addEventListener('click', () => {
  renderPokemon(Math.floor(Math.random() * 898) + 1);
});

// Inicializar o jogo
renderPokemon(Math.floor(Math.random() * 898) + 1);