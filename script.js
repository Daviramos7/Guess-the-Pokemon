const pokemonName = document.querySelector('.pokemon__name');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonImage = document.querySelector('.pokemon__image');
const form = document.querySelector('.form');
const input = document.querySelector('.input__search');
const buttonHint = document.querySelector('.btn-hint');
const buttonRestart = document.querySelector('.btn-restart');
const suggestionsList = document.querySelector('.suggestions-list');
const responseText = document.querySelector('.response-text');
const segment1 = document.getElementById('segment1');
const segment2 = document.getElementById('segment2');
const segment3 = document.getElementById('segment3');
const attemptsContainer = document.querySelector('.attempts-container');
const hintsContent = document.querySelector('.hints-content');

// Elementos para a navegação por abas
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');
const tabArrowLeft = document.querySelector('.tab-arrow.left');
const tabArrowRight = document.querySelector('.tab-arrow.right');

let currentPokemon = null;
let hintsUsed = 0;
let attemptsLeft = 3;
let currentSelectionIndex = -1;
let suggestionsActive = false;
let score = 0;
let highScore = localStorage.getItem('pokedexHighScore') || 0;
let attempts = [];
let currentTabIndex = 0;

// Função para reiniciar o jogo
function restartGame() {
  score = 0;
  updateScoreDisplay();
  renderPokemon(Math.floor(Math.random() * 151) + 1);
  setActiveTab(0); // Volta para a aba de tentativas
}

// Inicializar navegação por abas
function initTabs() {
  // Configurar navegação por abas
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      // Se for a aba de recomeçar (índice 2), reinicia o jogo imediatamente
      if (index === 2) {
        restartGame();
      } else {
        setActiveTab(index);
      }
    });
  });

  // Configurar navegação por setas
  tabArrowLeft.addEventListener('click', () => {
    navigateTab('prev');
  });

  tabArrowRight.addEventListener('click', () => {
    navigateTab('next');
  });

  // Adicionar detecção de toque para swipe nas abas (para dispositivos móveis)
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.querySelector('.tab-content').addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);
  
  document.querySelector('.tab-content').addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, false);
  
  function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
      // Swipe para a esquerda
      navigateTab('next');
    } else if (touchEndX > touchStartX + 50) {
      // Swipe para a direita
      navigateTab('prev');
    }
  }
}

function setActiveTab(index) {
  // Remover classe active de todas as abas
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanels.forEach(panel => panel.classList.remove('active'));
  
  // Adicionar classe active à aba selecionada
  tabButtons[index].classList.add('active');
  tabPanels[index].classList.add('active');
  
  currentTabIndex = index;
}

function navigateTab(direction) {
  let newIndex = currentTabIndex;
  
  if (direction === 'next') {
    newIndex = (currentTabIndex + 1) % tabButtons.length;
  } else if (direction === 'prev') {
    newIndex = (currentTabIndex - 1 + tabButtons.length) % tabButtons.length;
  }
  
  setActiveTab(newIndex);
}

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

const getTypeIcon = (type) => {
  const typeIcons = {
    normal: '⚪',
    fire: '🔥',
    water: '💧',
    electric: '⚡',
    grass: '🌿',
    ice: '❄️',
    fighting: '👊',
    poison: '☠️',
    ground: '🌍',
    flying: '🦅',
    psychic: '🔮',
    bug: '🐛',
    rock: '🪨',
    ghost: '👻',
    dragon: '🐉',
    dark: '🌑',
    steel: '⚔️',
    fairy: '🧚'
  };
  return typeIcons[type] || '❓';
};

const getHints = (data) => {
  const types = data.types.map(t => ({
    name: t.type.name,
    icon: getTypeIcon(t.type.name)
  }));
  
  return [
    `Tipo: ${types.map(t => `${t.icon} ${t.name}`).join(', ')}`,
    `Nome: ${maskName(data.name)}`,
    "Revelando mais do Pokémon..."
  ];
};

const updateLifeBar = () => {
  segment1.className = 'life-bar__segment inactive';
  segment2.className = 'life-bar__segment inactive';
  segment3.className = 'life-bar__segment inactive';
  
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

const addAttempt = (pokemon, isCorrect = false) => {
  // Verificar quais tipos correspondem ao Pokémon atual
  const matchingTypes = pokemon.types.filter(type => 
    currentPokemon.types.some(currentType => 
      currentType.type.name === type.type.name
    )
  ).map(t => t.type.name);
  
  const attempt = {
    name: pokemon.name,
    image: pokemon.sprites.front_default,
    types: pokemon.types.map(t => t.type.name),
    matchingTypes: matchingTypes,
    isCorrect,
    timestamp: Date.now()
  };
  
  // Remover qualquer tentativa anterior com o mesmo nome e que não seja correta
  if (isCorrect) {
    attempts = attempts.filter(a => a.name !== pokemon.name || a.isCorrect);
  } else {
    attempts = attempts.filter(a => a.name !== pokemon.name || (a.isCorrect && a.name !== currentPokemon.name));
  }
  
  // Adicionar a nova tentativa como a primeira do array
  attempts.unshift(attempt);
  
  updateAttemptsBubble();
};

const updateAttemptsBubble = () => {
  // Limpar o container
  attemptsContainer.innerHTML = '';
  
  // Garantir que a caixa de resposta exista e esteja visível
  let attemptResponseEl = document.createElement('div');
  attemptResponseEl.className = 'attempt-response';
  attemptResponseEl.textContent = 'Adivinhe o Pokémon!';
  attemptsContainer.appendChild(attemptResponseEl);
  
  if (attempts.length > 0) {
    // Verificar se já existe um título para as tentativas
    const attemptsTitle = document.createElement('div');
    attemptsTitle.className = 'attempts-title';
    attemptsTitle.textContent = 'Tentativas';
    attemptsContainer.appendChild(attemptsTitle);
    
    // Definir quantas tentativas mostrar
    const visibleAttempts = attempts.slice(0, 5);
    
    // Adicionar cada tentativa
    visibleAttempts.forEach((attempt, index) => {
      const attemptElement = document.createElement('div');
      attemptElement.className = `attempt ${attempt.isCorrect ? 'correct' : ''}`;
      
      // Criar os elementos para imagem, nome e tipos
      const imgElement = document.createElement('img');
      imgElement.src = attempt.image;
      imgElement.alt = attempt.name;
      imgElement.className = 'attempt-image';
      imgElement.style.width = '25px';
      imgElement.style.height = '25px';
      
      const nameElement = document.createElement('span');
      nameElement.className = 'attempt-name';
      nameElement.textContent = attempt.name;
      
      const typesContainer = document.createElement('div');
      typesContainer.className = 'attempt-types';
      
      // Adicionar os tipos
      attempt.types.forEach(type => {
        const isMatchingType = attempt.matchingTypes.includes(type);
        const typeSpan = document.createElement('span');
        typeSpan.className = `type-badge ${type} ${isMatchingType ? 'correct-type' : ''}`;
        typeSpan.title = type;
        typeSpan.innerHTML = getTypeIcon(type);
        typesContainer.appendChild(typeSpan);
      });
      
      // Montar o elemento de tentativa
      attemptElement.appendChild(imgElement);
      attemptElement.appendChild(nameElement);
      attemptElement.appendChild(typesContainer);
      
      // Adicionar ao container principal
      attemptsContainer.appendChild(attemptElement);
    });
    
    // Adicionar contador se necessário
    if (attempts.length > 5) {
      const countElement = document.createElement('div');
      countElement.className = 'attempt-count';
      countElement.textContent = `+${attempts.length - 5}`;
      attemptsContainer.appendChild(countElement);
    }
    
    // Mudar para a aba de tentativas
    setActiveTab(0);
  }
  
  // Forçar a atualização visual
  const bubble = document.querySelector('.multifunctional-bubble');
  if (bubble) {
    void bubble.offsetWidth;
  }
};

const renderPokemon = async (pokemon) => {
  pokemonName.innerHTML = '';
  pokemonNumber.innerHTML = '';
  hintsUsed = 0;
  attemptsLeft = 3;
  
  // Limpar todas as tentativas ao reiniciar o jogo
  attempts = [];
  
  // Limpar o container de dicas na aba de dicas
  hintsContent.innerHTML = '';
  
  // Atualizar a mensagem da caixa de resposta na aba de tentativas
  updateGameResponse('Adivinhe o Pokémon!', '');
  
  // Garantir que a caixa de resposta exista e esteja visível desde o início
  let attemptResponseEl = document.querySelector('.attempt-response');
  if (!attemptResponseEl) {
    attemptResponseEl = document.createElement('div');
    attemptResponseEl.className = 'attempt-response';
    const attemptsContainer = document.querySelector('.attempts-container');
    if (attemptsContainer) {
      attemptsContainer.appendChild(attemptResponseEl);
      attemptResponseEl.textContent = 'Adivinhe o Pokémon!';
    }
  }
  
  // Remover a silhueta e esconder a imagem inicialmente
  pokemonImage.classList.add('hidden');
  pokemonImage.classList.remove('silhouette', 'revealed');
  pokemonImage.style.filter = '';
  pokemonImage.style.opacity = '1';
  
  // Atualizar a barra de vida
  updateLifeBar();
  
  // Atualizar a lista de tentativas
  updateAttemptsBubble();
  
  if (pokemon === 'restart') {
    return;
  }
  
  try {
  const data = await fetchPokemon(pokemon);
  if (data) {
    currentPokemon = data;
      
      // Tentar obter o GIF animado primeiro, com fallbacks para outras versões
      const imageUrl = 
        (data.sprites.versions && 
         data.sprites.versions['generation-v'] && 
         data.sprites.versions['generation-v']['black-white'] && 
         data.sprites.versions['generation-v']['black-white'].animated && 
         data.sprites.versions['generation-v']['black-white'].animated.front_default) ||
        data.sprites.front_default ||
        data.sprites.other["official-artwork"].front_default;
      
      // Certificar que a imagem será carregada corretamente
      pokemonImage.onload = function() {
        // A imagem foi carregada, mas permanece oculta para o jogo
        pokemonImage.classList.add('silhouette');
        pokemonImage.classList.remove('hidden');
      };
      
      pokemonImage.onerror = function() {
        console.error('Erro ao carregar a imagem do Pokémon');
        // Em caso de erro, tentar a imagem padrão
        pokemonImage.src = data.sprites.front_default;
      };
      
      pokemonImage.src = imageUrl;
      
      pokemonName.innerHTML = '';
      pokemonNumber.innerHTML = '';
      
      input.value = '';
      input.focus();
      
      // Garantir que a imagem seja mostrada como silhueta após um breve delay
      setTimeout(() => {
        if (pokemonImage.complete) {
      pokemonImage.classList.add('silhouette'); 
          pokemonImage.classList.remove('hidden');
        }
      }, 300);
    } else {
      renderPokemon(Math.floor(Math.random() * 151) + 1);
    }
  } catch (error) {
    console.error('Erro ao buscar Pokémon', error);
    renderPokemon(Math.floor(Math.random() * 151) + 1);
  }
};

const checkGuess = async (guess) => {
  const guessLower = guess.toLowerCase().trim();
  if (!guessLower) return;
  
  try {
    // Verificar se o jogador já ganhou ou perdeu
    if (attemptsLeft <= 0) {
      // Atualizar a caixa de resposta na aba de tentativas
      updateGameResponse(`Acabaram suas chances! Era ${currentPokemon.name}.`, 'game-over');
      
      // Não mudar para a aba de recomeçar após a derrota
      // Permanecer na aba de tentativas
      return;
    }
    
    // Verificar se o Pokémon já foi tentado
    const alreadyGuessed = attempts.some(attempt => attempt.name.toLowerCase() === guessLower);
    if (alreadyGuessed) {
      updateGameResponse(`Você já tentou ${guessLower}. Tente outro Pokémon!`, 'incorrect');
      return;
    }
    
    // Buscar informações do Pokémon do palpite
    const data = await fetchPokemon(guessLower);
    if (data) {
      // Comparar com o Pokémon atual
      const isCorrect = data.name === currentPokemon.name;
      addAttempt(data, isCorrect);
      
      if (isCorrect) {
        // Acertou!
        pokemonImage.classList.remove('hidden', 'silhouette');
        pokemonImage.classList.add('revealed');
        pokemonName.innerHTML = data.name;
        
        // Atualizar pontuação
        score += (10 * attemptsLeft);
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('pokedexHighScore', highScore);
        }
        updateScoreDisplay();
        
        // Atualizar resposta
        const message = `Parabéns! Você acertou! +${10 * attemptsLeft} pontos`;
        updateGameResponse(message, 'correct');
        
        // Não mudar para a aba de recomeçar após a vitória
        // Permanecer na aba de tentativas
      } else {
        // Errou
        attemptsLeft--;
        updateLifeBar();
        
        if (attemptsLeft <= 0) {
          // Game over
          const message = `Acabaram suas chances! Era ${currentPokemon.name}.`;
          updateGameResponse(message, 'game-over');
          
          // Revelar o Pokémon
          pokemonImage.classList.remove('hidden', 'silhouette');
          pokemonImage.classList.add('revealed');
          pokemonName.innerHTML = currentPokemon.name;
          
          // Não mudar para a aba de recomeçar após a derrota
          // Permanecer na aba de tentativas
        } else {
          // Ainda tem chances
          const message = `Incorreto! Tente novamente. ${attemptsLeft} chance(s) restante(s).`;
          updateGameResponse(message, 'incorrect');
          
          // Permanecer na aba de tentativas
          setActiveTab(0);
        }
      }
    } else {
      const message = 'Pokémon não encontrado. Tente outro.';
      updateGameResponse(message, 'incorrect');
      
      // Permanecer na aba de tentativas
      setActiveTab(0);
    }
  } catch (error) {
    console.error('Erro ao verificar palpite', error);
    const message = 'Erro ao verificar palpite. Tente novamente.';
    updateGameResponse(message, 'incorrect');
    
    // Permanecer na aba de tentativas
    setActiveTab(0);
  }
};

// Otimizar o gerenciamento da caixa de resposta
const updateGameResponse = (message, className) => {
  // Verificar se já existe uma caixa de resposta na aba de tentativas
  let attemptResponseEl = document.querySelector('.attempt-response');
  
  if (!attemptResponseEl) {
    // Criar uma nova caixa de resposta se não existir
    attemptResponseEl = document.createElement('div');
    attemptResponseEl.className = 'attempt-response';
    
    // Obter o painel de tentativas
    const tabPanel = document.getElementById('attempts-tab');
    const attemptsContainer = document.querySelector('.attempts-container');
    
    // Inserir a caixa de resposta no painel de tentativas
    if (attemptsContainer) {
      // Inserir como primeiro filho do container
      if (attemptsContainer.firstChild) {
        attemptsContainer.insertBefore(attemptResponseEl, attemptsContainer.firstChild);
      } else {
        attemptsContainer.appendChild(attemptResponseEl);
      }
    } else if (tabPanel) {
      // Fallback: se não encontrar o container de tentativas, adiciona direto ao painel
      tabPanel.appendChild(attemptResponseEl);
    }
  }
  
  // Atualizar o texto e estilo
  attemptResponseEl.textContent = message;
  
  // Limpar as classes anteriores
  attemptResponseEl.classList.remove('correct', 'incorrect', 'game-over');
  
  // Adicionar a nova classe
  if (className) {
    attemptResponseEl.classList.add(className);
  }
};

// Event listener para ao submeter o formulário, manter na aba de tentativas
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await checkGuess(input.value);
  input.value = '';
  clearSuggestions();
  
  // Atualizar a lista de tentativas
  updateAttemptsBubble();
  
  // Manter na aba de tentativas após submeter
  setActiveTab(0);
});

buttonHint.addEventListener('click', () => {
  if (currentPokemon) {
    // Verificar se o jogo já terminou (jogador perdeu todas as tentativas ou acertou o Pokémon)
    const gameEnded = attemptsLeft <= 0 || attempts.some(a => a.isCorrect && a.name === currentPokemon.name);
    
    if (gameEnded) {
      buttonHint.classList.add('shake');
      setTimeout(() => {
        buttonHint.classList.remove('shake');
      }, 500);
      updateGameResponse('O jogo já terminou! Não é possível obter mais dicas.', 'game-over');
      return;
    }
    
    const hints = getHints(currentPokemon);

    if (hintsUsed < hints.length) {
      // Limpar qualquer dica anterior na aba de dicas (tab 1)
      const hintsContent = document.querySelector('.hints-content');
      
      // Criar o container de dicas para a aba de dicas
      const hintContainer = document.createElement('div');
      hintContainer.className = 'hint-container';
      
      if (hintsUsed === 0) { 
        const types = currentPokemon.types.map(t => ({
          name: t.type.name,
          icon: getTypeIcon(t.type.name)
        }));
        
        // Conteúdo detalhado para a aba de dicas
        hintContainer.innerHTML = `
          <h3 class="hint-title">Tipo do Pokémon</h3>
          <div class="hint-type-badges">
            ${types.map(t => `<span class="type-badge ${t.name}" title="${t.name}">${t.icon}</span>`).join(' ')}
          </div>
        `;
        
        updateGameResponse('Dica: Tipo do Pokémon revelado', '');
      } else if (hintsUsed === 1) { 
        // Conteúdo detalhado para a aba de dicas
        const maskedName = hints[hintsUsed].replace("Nome: ", "");
        hintContainer.innerHTML = `
          <h3 class="hint-title">Nome do Pokémon</h3>
          <div class="hint-name-container">
            ${maskedName}
          </div>
        `;
        
        updateGameResponse('Dica: Nome parcialmente revelado', '');
      } else if (hintsUsed === 2) { 
        // Diminuir o contraste aplicando um filtro, mas manter visível
        pokemonImage.classList.remove('hidden');
        pokemonImage.classList.remove('silhouette'); // Remover silhueta para mostrar o GIF animado
        pokemonImage.style.opacity = '0.6';
        pokemonImage.style.filter = 'contrast(0.7) brightness(0.7)';
        
        // Conteúdo detalhado para a aba de dicas
        hintContainer.innerHTML = `
          <h3 class="hint-title">Silhueta</h3>
          <div class="hint-name-container">
            Pokémon parcialmente revelado
          </div>
        `;
        
        updateGameResponse('Dica: Revelando mais do Pokémon...', '');
      }
      
      // Adicionar a dica completa na aba de dicas
      hintsContent.appendChild(hintContainer);
      
      // Não muda automaticamente para a aba de dicas
      // setActiveTab(1); <-- Removida esta linha para não mudar para a aba de dicas automaticamente

      hintsUsed++;
    }

    if (hintsUsed === hints.length) {
      buttonHint.classList.add('shake');
      setTimeout(() => {
        buttonHint.classList.remove('shake');
      }, 500);
      updateGameResponse('Sem mais dicas disponíveis!', '');
    }
  }
});

buttonRestart.addEventListener('click', () => {
  restartGame();
});

// Função para limpar as sugestões
const clearSuggestions = () => {
  const oldList = document.querySelector('.suggestions-list-fixed');
  if (oldList) oldList.remove();
  currentSelectionIndex = -1; // Resetar o índice ao fechar a lista
  suggestionsActive = false;
};

// Função para limpar o input
const clearInput = () => {
  input.value = '';
  clearSuggestions();
  document.querySelector('.form').classList.remove('has-text');
  input.focus();
};

// Função para atualizar as sugestões
const updateSuggestions = async (suggestions) => {
  // Limpar qualquer lista existente
  clearSuggestions();
  
  if (!suggestions || suggestions.length === 0) return;
  
  // Criar uma nova lista
  const listElement = document.createElement('ul');
  listElement.className = 'suggestions-list-fixed';
  
  // Inserir a lista depois do form para que apareça abaixo do input
  const formContainer = document.querySelector('.form-container');
  if (formContainer) {
    formContainer.appendChild(listElement);
  }
  
  // Para cada Pokémon nas sugestões, buscar os dados e obter os tipos
  for (const pokemonName of suggestions) {
    try {
      const pokemonData = await getPokemonData(pokemonName);
      if (pokemonData) {
        const listItem = document.createElement('li');
        
        // Criar o span para o nome do Pokémon
        const nameSpan = document.createElement('span');
        nameSpan.textContent = pokemonData.name;
        
        // Adicionar os tipos do Pokémon como badges
        const typesContainer = document.createElement('div');
        typesContainer.className = 'pokemon-types';
        
        pokemonData.types.forEach(type => {
          const typeSpan = document.createElement('span');
          typeSpan.className = `type-badge ${type.type.name}`;
          typeSpan.setAttribute('title', type.type.name);
          typeSpan.innerHTML = getTypeIcon(type.type.name);
          typesContainer.appendChild(typeSpan);
        });
        
        // Adicionar ao item da lista
        listItem.appendChild(nameSpan);
        listItem.appendChild(typesContainer);
        
        // Event listener para quando o usuário clicar em um item
        listItem.addEventListener('click', () => {
          input.value = pokemonData.name;
          clearSuggestions();
          checkGuess(pokemonData.name);
        });
        
        listElement.appendChild(listItem);
      }
    } catch (error) {
      console.error(`Erro ao buscar dados do Pokémon ${pokemonName}:`, error);
    }
  }
  
  suggestionsActive = true;
};

// Função para buscar os dados de um Pokémon
const getPokemonData = async (pokemonName) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
    if (response.status === 200) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar Pokémon:', error);
    return null;
  }
};

// Adicionar eventos para navegação usando o teclado
input.addEventListener('keydown', (e) => {
  const suggestionsEl = document.querySelector('.suggestions-list-fixed');
  
  if (!suggestionsEl) return;
  
  const items = suggestionsEl.querySelectorAll('li');
  if (items.length === 0) return;
  
  // Função auxiliar para atualizar a seleção
  const updateSelection = (newIndex) => {
    // Remover a seleção atual
    items.forEach(item => item.classList.remove('selected'));
    
    // Adicionar a nova seleção
    items[newIndex].classList.add('selected');
    
    // Garantir que o item selecionado esteja visível
    const itemTop = items[newIndex].offsetTop;
    const itemHeight = items[newIndex].offsetHeight;
    const listScrollTop = suggestionsEl.scrollTop;
    const listHeight = suggestionsEl.offsetHeight;
    
    if (itemTop < listScrollTop) {
      suggestionsEl.scrollTop = itemTop;
    } else if ((itemTop + itemHeight) > (listScrollTop + listHeight)) {
      suggestionsEl.scrollTop = itemTop + itemHeight - listHeight;
    }
  };
  
  // Manipulação das teclas
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    currentSelectionIndex = (currentSelectionIndex + 1) % items.length;
    updateSelection(currentSelectionIndex);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    currentSelectionIndex = (currentSelectionIndex - 1 + items.length) % items.length;
    updateSelection(currentSelectionIndex);
  } else if (e.key === 'Enter' && currentSelectionIndex >= 0) {
    e.preventDefault();
    const selectedItem = items[currentSelectionIndex].querySelector('span').textContent;
    input.value = selectedItem;
    checkGuess(input.value);
    clearSuggestions();
  } else if (e.key === 'Escape') {
    clearSuggestions();
  }
});

// Evento de input para mostrar sugestões enquanto o usuário digita
input.addEventListener('input', async () => {
  const query = input.value.toLowerCase();
  
  // Adicionar ou remover a classe has-text
  if (query.length > 0) {
    document.querySelector('.form').classList.add('has-text');
  } else {
    document.querySelector('.form').classList.remove('has-text');
  }
  
  if (query.length > 1) {
    try {
      const allPokemons = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
      const allPokemonsData = await allPokemons.json();
      const filteredSuggestions = allPokemonsData.results
        .filter(pokemon => pokemon.name.toLowerCase().includes(query))
        .map(pokemon => pokemon.name);
      
      let displaySuggestions = filteredSuggestions.slice(0, 5);
      
      await updateSuggestions(displaySuggestions);
      currentSelectionIndex = -1;
    } catch (error) {
      console.error('Erro ao buscar lista de Pokémon:', error);
    }
  } else {
    clearSuggestions();
  }
});

// Adicionar manipulador de blur para esconder as sugestões quando o input perde o foco
input.addEventListener('blur', (e) => {
  // Pequeno atraso para permitir que o clique em um item da lista seja processado
  setTimeout(() => {
    if (!document.activeElement.closest('.suggestions-list-fixed')) {
      clearSuggestions();
    }
  }, 150);
});

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
  // Iniciar com o primeiro Pokémon
  renderPokemon(Math.floor(Math.random() * 151) + 1);
  
  updateScoreDisplay();
  initTabs();
  
  // Inicializar com aba de tentativas ativa
  setActiveTab(0);
  
  // Adicionar evento ao botão de limpar
  document.querySelector('.clear-button').addEventListener('click', clearInput);
  
  // Adicionar evento ao botão de recomeçar
  document.querySelector('.btn-restart').addEventListener('click', restartGame);
  
  // Fechar sugestões quando clicar fora delas
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.form input') && 
        !e.target.closest('.suggestions-list-fixed')) {
      clearSuggestions();
    }
  });
});