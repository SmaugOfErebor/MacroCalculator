const apiKeyInputId = 'apiKeyInput';
const apiKeyStorageKey = 'usdaApiKey';
const foodResultsSelectorId = 'foodResultsSelector';
const selectedFoods = [];

let apiKeyInput = document.getElementById(apiKeyInputId);

// Load the API key immediately when the window loads.
window.onload = () => {
    apiKeyInput.value = getApiKey();
};

// Add an event handler to store any custom API key entered by the user.
// TODO: Confirm validity of API key entered.
apiKeyInput.addEventListener('input', (e) => {
    localStorage.setItem(apiKeyStorageKey, e.target.value);
});

/**
 * @returns Either a stored, custom API key or the demo API key.
 */
function getApiKey() {
    return localStorage.getItem(apiKeyStorageKey) || 'DEMO_KEY';
}

/**
 * Qeuries the USDA API for foods with the search criteria entered by the user.
 * Adds each result to the fod selector for the user to choose the most appropriate result.
 * TODO: Searches commonly return your search criteria, but in all caps (e.g. searching 'apple' returns 'APPLE').
 * TODO: These results are usually under the "Branded Foods" category and their data is in a different format than the results under the "Foundation Foods" category.
 * TODO: The results in the "Foundation Foods" category are generally what the user will want when searching for something as foundational as 'apple'.
 * TODO: Perhaps prioritize "Foundation Foods" results when they are available?
 */
async function searchFood() {
    const foodSearchInput = document.getElementById('foodSearchInput');
    const searchCriteria = encodeURIComponent(foodSearchInput.value);
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${searchCriteria}&api_key=${getApiKey()}`;
    const foodResultsSelector = document.getElementById(foodResultsSelectorId);
    foodResultsSelector.innerHTML = '';

    const json = await fetchJson(url);

    json.foods.forEach(food => {
        const option = document.createElement('option');
        option.json = food;
        option.textContent = food.description;
        foodResultsSelector.appendChild(option);
    });
}

/**
 * Adds an element representing the currently selected food for the user to specify how much was eaten.
 */
function addSelectedFood() {
    // Ensure there is a selected item.
    const selector = document.getElementById(foodResultsSelectorId);
    const selectedFood = selector.options[selector.selectedIndex];
    if (!selectedFood) {
        return;
    }

    // Disallow duplicates.
    const fdcId = selectedFood.json.fdcId;
    if (selectedFoods.some(f => f.json.fdcId === fdcId)) {
        return;
    }

    // Add the food JSON to the selected foods array.
    selectedFoods.push(selectedFood.json);

    // Add a selected food template visually corresponding to this new selected food.
    const selectedFoodsDiv = document.getElementById('selectedFoodsDiv');
    const newSelectedFood = new SelectedFoodItem(selectedFood.json);
    selectedFoodsDiv.appendChild(newSelectedFood.element);
}

function updateAmount(index, value) {
    selectedFoods[index].amount = parseFloat(value) || 0;
}

/**
 * Calculates the sum of macronutirents and calories from all selected foods.
 */
async function calculateAllMacros() {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Sum all of the macronutrients in all selected foods.
    for (const food of selectedFoods) {
        const url = `https://api.nal.usda.gov/fdc/v1/food/${food.fdcId}?api_key=${getApiKey()}`;

        const json = await fetchJson(url);
        if (!json) {
            // TODO: Give some feedback to the user.
            return;
        }

        let protein = 0;
        let carbs = 0;
        let fat = 0;

        // TODO: It may be worth exiting early once all three macronutrients are found. There can be a lot of returned nutrient values.
        json.foodNutrients.forEach(n => {
            switch (n.nutrient.id) {
                case 1003:
                    protein = n.amount;
                    break;

                case 1004:
                    fat = n.amount;
                    break;

                case 1005:
                    carbs = n.amount;
                    break;
            }
        });

        // Food amount is typically 100g, but not in all cases.
        // Especially for branded foods, the amount may be different.
        // The existence of the "servingSize" key in the returned data means the service is specified.
        const scale = food.amountEaten / 100;
        totalProtein += protein * scale;
        totalCarbs += carbs * scale;
        totalFat += fat * scale;
    }

    const calories = (totalProtein * 4 + totalCarbs * 4 + totalFat * 9).toFixed(1);
    document.getElementById('resultsDiv').innerHTML = `
        <h3>Total Macros</h3>
        <p><strong>Protein:</strong> ${totalProtein.toFixed(1)}g</p>
        <p><strong>Carbs:</strong> ${totalCarbs.toFixed(1)}g</p>
        <p><strong>Fat:</strong> ${totalFat.toFixed(1)}g</p>
        <p><strong>Calories:</strong> ${calories}</p>
    `;
}

/**
 * Performs the HTTP response fetch and awaiting the JSON from the response.
 * In the future, will give detailed error feedback to the user.
 * @param {string} url
 * @returns Either undefined in the case of an error of the JSON from the HTTP response.
 */
async function fetchJson(url) {
    let response;
    try {
        response = await fetch(url);
    } catch (error) {
        console.error('Error fetching HTTP response:', error);
        // TODO: Give some feedback to the user.
        return;
    }

    let json;
    try {
        json = await response.json();
    } catch (error) {
        console.error('Error retrieving HTTP response JSON:', error);
        // TODO: Give some feedback to the user.
        return;
    }

    return json;
}

class SelectedFoodItem {
    constructor(json) {
        const template = document.getElementById('selectedFoodTemplate');
        this.element = template.content.cloneNode(true).children[0];
        this.element.querySelector('.selectedFoodName').textContent = json.description;

        this.element.querySelector('.eatenAmountInput').addEventListener('input', (e) => {
            json.amountEaten = e.target.value;
        });
    }
}