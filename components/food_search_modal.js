import { fetchJson } from '/components/utils.js';

export async function openFoodSelector(apiKey) {
    loadModalStyles();

    // Load the HTML file
    const html = await fetch("/components/food_search_modal.html").then(r => r.text());

    // Convert HTML string into DOM nodes
    const template = document.createElement("div");
    template.innerHTML = html.trim();

    // Extract the modal element and add it to the DOM
    const modal = template.firstElementChild;
    document.body.appendChild(modal);

    modal.querySelector('.search-btn').onclick = async () => {
        await searchFood(modal, apiKey);
    };

    return new Promise(resolve => {
        modal.querySelector(".add-selected-food-btn").onclick = () => {
            const foodResultsSelector = modal.querySelector('.food-results-selector');
            const option = foodResultsSelector.options[foodResultsSelector.selectedIndex];
            const foodJson = option.json;
            cleanup();
            resolve(foodJson);
        };

        modal.querySelector(".cancel-btn").onclick = () => {
            cleanup();
            resolve(null);
        };

        function cleanup() {
            modal.remove();
        }
    });
}

function loadModalStyles() {
    if (document.getElementById("food-search-modal-styles")) return;

    const link = document.createElement("link");
    link.id = "food-search-modal-styles";
    link.rel = "stylesheet";
    link.href = "/components/food_search_modal.css";
    document.head.appendChild(link);
}


/**
 * Qeuries the USDA API for foods with the search criteria entered by the user.
 * Adds each result to the fod selector for the user to choose the most appropriate result.
 * TODO: Searches commonly return your search criteria, but in all caps (e.g. searching 'apple' returns 'APPLE').
 * TODO: These results are usually under the "Branded Foods" category and their data is in a different format than the results under the "Foundation Foods" category.
 * TODO: The results in the "Foundation Foods" category are generally what the user will want when searching for something as foundational as 'apple'.
 * TODO: Perhaps prioritize "Foundation Foods" results when they are available?
 */
async function searchFood(modal, apiKey) {
    const foodSearchInput = modal.querySelector('.search-input');
    const searchCriteria = encodeURIComponent(foodSearchInput.value);
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${searchCriteria}&api_key=${apiKey}`;
    const foodResultsSelector = modal.querySelector('.food-results-selector');
    foodResultsSelector.innerHTML = '';

    const json = await fetchJson(url);

    json.foods.forEach(food => {
        const option = document.createElement('option');
        option.json = food;
        option.textContent = food.description;
        foodResultsSelector.appendChild(option);
    });
}