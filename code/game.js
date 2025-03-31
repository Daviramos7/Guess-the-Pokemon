let currentPokemon = null;
let tentativas = 3;
let dicasRestantes = 3;
let tipoPokemon = "";
let nomePokemon = "";
let idPokemon = "";
let dicaContainer = document.querySelector('#dicas');
let gameOver = false;
let selectedIndex = -1; // Para controlar a sugestão selecionada
let pokemonsTentados = []; // Lista para armazenar os Pokémon já tentados

function loadRandomPokemon() {
    let randomId = Math.floor(Math.random() * 898) + 1;
    fetch('https://pokeapi.co/api/v2/pokemon/' + randomId)
        .then(response => response.json())
        .then(data => {
            currentPokemon = data.name.toLowerCase();
            tipoPokemon = data.types.map(t => t.type.name).join(", ");
            idPokemon = data.id;
            nomePokemon = data.name;

            document.querySelector('.imagem').src = data.sprites.other['official-artwork'].front_default;
            document.querySelector('.imagem').style.filter = 'contrast(0%)';
            document.querySelector('.nome').innerHTML = "???";
            document.querySelector('.tentativas').innerHTML = "Tentativas restantes: 3";
            document.querySelector('.dicas-usadas').innerHTML = "Dicas restantes: 3";
            dicaContainer.innerHTML = "";
            document.querySelector('#reiniciar-btn').style.display = "none";

            tentativas = 3;
            dicasRestantes = 3;
            gameOver = false;
            selectedIndex = -1; // Resetar a seleção
            pokemonsTentados = []; // Resetar a lista de tentativas

            console.log("Botão de dica visível:", document.querySelector('#dica-btn').classList.contains('hidden'));

            // Garantir que o botão de dica apareça
            document.querySelector('#dica-btn').classList.remove('hidden'); // Remover 'hidden' para mostrar o botão
            console.log("Botão de dica visível após reiniciar:", document.querySelector('#dica-btn').classList.contains('hidden'));
        })
        .catch(error => console.log(error));
}

function checkGuess() {
    if (gameOver) return;

    let guess = document.querySelector('#guess').value.toLowerCase();

    // Verificar se o input está vazio
    if (guess === "") {
        document.querySelector('.tentativas').innerHTML = "Por favor, insira o nome de um Pokémon.";
        return;
    }

    // Verificar se o Pokémon já foi tentado
    if (pokemonsTentados.includes(guess)) {
        document.querySelector('.tentativas').innerHTML = `Você já tentou o Pokémon "${guess}" antes e ele está errado! Tente outro.`;
        return;
    }

    // Adicionar à lista de tentativas
    pokemonsTentados.push(guess);

    if (guess === currentPokemon) {
        document.querySelector('.imagem').style.filter = 'contrast(100%)';
        document.querySelector('.nome').innerHTML = nomePokemon;
        document.querySelector('.tentativas').innerHTML = `Parabéns! Você acertou!<br>Nome: ${nomePokemon}<br>ID: ${idPokemon}<br>Tipo: ${tipoPokemon}`;
        document.querySelector('#reiniciar-btn').style.display = "block";
        gameOver = true;
    } else {
        tentativas--;
        if (tentativas > 0) {
            document.querySelector('.tentativas').innerHTML = `Errou! Você tem mais ${tentativas} tentativa(s).`;
        } else {
            document.querySelector('.imagem').style.filter = 'contrast(100%)';
            document.querySelector('.nome').innerHTML = nomePokemon;
            document.querySelector('.tentativas').innerHTML = `Fim de jogo! O Pokémon era:<br>Nome: ${nomePokemon}<br>ID: ${idPokemon}<br>Tipo: ${tipoPokemon}`;
            document.querySelector('#reiniciar-btn').style.display = "block";
            gameOver = true;
        }
    }
}

function pedirDica() {
    if (gameOver || dicasRestantes <= 0) return;

    let dica = "";
    let dicaElement = document.createElement('div');
    dicaElement.classList.add('dica-item');
    
    switch (dicasRestantes) {
        case 3:
            dica = `Dica 1: Tipo do Pokémon: ${tipoPokemon}`;
            break;
        case 2:
            let letrasDicas = nomePokemon.split('').map((letra, i) => (i % 2 === 0 ? letra : "_")).join('');
            dica = `Dica 2: Algumas letras do nome: ${letrasDicas}`;
            break;
        case 1:
            document.querySelector('.imagem').style.filter = 'contrast(40%)';
            dica = "Dica 3: A imagem está mais visível!";
            break;
    }

    dicasRestantes--;
    document.querySelector('.dicas-usadas').innerHTML = `Dicas restantes: ${dicasRestantes}`;
    
    dicaElement.textContent = dica;
    dicaElement.onclick = function() {
        this.style.display = 'none'; // Esconde a dica quando clicada
    };

    dicaContainer.appendChild(dicaElement);

    // Esconder o botão de dica se não houver mais dicas
    if (dicasRestantes === 0) {
        document.querySelector('#dica-btn').classList.add('hidden');
    }
}

function resetGame() {
    document.querySelector('#guess').value = "";
    loadRandomPokemon(); // Carrega um novo Pokémon

    // Resetar o conteúdo das dicas
    document.querySelector('#dicas').innerHTML = "";

    // Resetar os botões de dica
    const dica1Btn = document.querySelector('#dica-btn-1');
    const dica2Btn = document.querySelector('#dica-btn-2');
    const dica3Btn = document.querySelector('#dica-btn-3');

    dica1Btn.textContent = "Dica 1: Tipo";
    dica2Btn.textContent = "Dica 2: Nome parcial";
    dica3Btn.textContent = "Dica 3: Imagem visível";

    // Resetar estados das dicas
    dica1Btn.disabled = false;
    dica2Btn.disabled = true;
    dica3Btn.disabled = true;

    dica1Btn.style.backgroundColor = "#c8a832";
    dica2Btn.style.backgroundColor = "#c8a832";
    dica3Btn.style.backgroundColor = "#c8a832";

    // Resetar variáveis de controle
    dicasRestantes = 3;
    dicasUtilizadas = 0;

    // Se você estiver usando variáveis globais para as dicas, resetá-las também
    dica1Usada = false;
    dica2Usada = false;
    dica3Usada = false;

    // Atualizar contador de dicas restantes
    document.querySelector('.dicas-usadas').textContent = "Dicas restantes: 3";

    dicasRestantes = 3;
    atualizarDicasRestantes();
    
    
    
}




window.onload = loadRandomPokemon;

// AUTOCOMPLETAR
const input = document.querySelector('#guess');
const suggestionsBox = document.createElement('div');
suggestionsBox.classList.add('suggestions');
document.querySelector('.input-container').appendChild(suggestionsBox);

input.addEventListener('input', function (e) {
    let query = e.target.value.toLowerCase();
    if (query.length >= 2) {
        fetch('https://pokeapi.co/api/v2/pokemon/?limit=1000')
            .then(response => response.json())
            .then(data => {
                let matches = data.results.filter(pokemon => pokemon.name.includes(query));
                suggestionsBox.innerHTML = "";
                if (matches.length > 0) {
                    matches.forEach((pokemon, index) => {
                        fetch(pokemon.url)
                            .then(res => res.json())
                            .then(pokeData => {
                                let tipo = pokeData.types.map(t => t.type.name).join(", ");
                                let div = document.createElement('div');
                                div.textContent = `${pokemon.name} (Tipo: ${tipo})`;
                                div.onclick = () => {
                                    input.value = pokemon.name;
                                    suggestionsBox.style.display = "none";
                                };
                                div.classList.add('suggestion-item');
                                suggestionsBox.appendChild(div);
                            });
                    });
                    suggestionsBox.style.display = "block";
                } else {
                    suggestionsBox.style.display = "none";
                }
            });
    } else {
        suggestionsBox.style.display = "none";
    }
});

document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
    }
});

// Navegação com setas e confirmação com Enter
input.addEventListener('keydown', function (e) {
    let suggestionItems = document.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown' && selectedIndex < suggestionItems.length - 1) {
        selectedIndex++;
        updateSelection(suggestionItems);
    }
    
    if (e.key === 'ArrowUp' && selectedIndex > 0) {
        selectedIndex--;
        updateSelection(suggestionItems);
    }

    if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < suggestionItems.length) {
        let selectedItem = suggestionItems[selectedIndex];
        input.value = selectedItem.textContent.split(" (")[0]; // Pega o nome do Pokémon
        suggestionsBox.style.display = "none";
        checkGuess(); // Confirmar a seleção ao apertar Enter
    }
});

function updateSelection(suggestionItems) {
    suggestionItems.forEach((item, index) => {
        if (index === selectedIndex) {
            item.style.backgroundColor = '#ddd';
        } else {
            item.style.backgroundColor = '';
        }
    });
}

function pedirDica(numero) {
    if (gameOver || dicasRestantes <= 0) return;

    let botaoDica = document.querySelector(`#dica-btn-${numero}`);
    let dica = "";

    switch (numero) {
        case 1:
            dica = `Tipo: ${tipoPokemon}`;
            document.querySelector('#dica-btn-2').disabled = false; // Ativa a dica 2
            break;
        case 2:
            let letrasDicas = nomePokemon.split('').map((letra, i) => (i % 2 === 0 ? letra : "_")).join('');
            dica = `Nome: ${letrasDicas}`;
            document.querySelector('#dica-btn-3').disabled = false; // Ativa a dica 3
            break;
        case 3:
            document.querySelector('.imagem').style.filter = 'contrast(40%)';
            dica = "Imagem mais visível!";
            break;
    }

    // Atualiza o botão da dica para exibir o texto correto
    botaoDica.textContent = dica;
    botaoDica.style.backgroundColor = "rgb(124, 67, 14)"; // Nova cor para indicar que a dica foi usada
    botaoDica.style.color = "white";
    botaoDica.disabled = true; // Desativa o botão

    // Reduz o número de dicas restantes e atualiza na tela
    dicasRestantes--;
    atualizarDicasRestantes();
}

function atualizarDicasRestantes() {
    document.querySelector("#dicas-restantes").textContent = `Dicas restantes: ${dicasRestantes}`;
}


// Função para atualizar o contador de dicas restantes
function atualizarDicasRestantes() {
    const contador = document.querySelector('.dicas-usadas');
    contador.textContent = `Dicas restantes: ${dicasRestantes}`;
}

// Exemplo dentro de uma função de ativação de dica:
function ativarDica1() {
    if (!dica1Usada) {
        dica1Usada = true;
        dicasRestantes--;
        document.querySelector('#dica-btn-1').textContent = tipoPokemon;
        document.querySelector('#dica-btn-2').disabled = false;
        atualizarDicasRestantes(); // Atualiza a contagem na tela
    }
}

function ativarDica2() {
    if (!dica2Usada) {
        dica2Usada = true;
        dicasRestantes--;
        document.querySelector('#dica-btn-2').textContent = nomeParcialPokemon;
        document.querySelector('#dica-btn-3').disabled = false;
        atualizarDicasRestantes();
    }
}

function ativarDica3() {
    if (!dica3Usada) {
        dica3Usada = true;
        dicasRestantes--;
        document.querySelector('#pokemon-imagem').style.filter = "none";
        atualizarDicasRestantes();
    }
}


function atualizarDicasRestantes() {
    document.getElementById("dicas-restantes").textContent = `Dicas restantes: ${dicasRestantes}`;
}

