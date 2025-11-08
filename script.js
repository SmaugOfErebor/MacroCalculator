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
        option.value = food.fdcId;
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
    const selectedOption = selector.options[selector.selectedIndex];
    if (!selectedOption) {
        return;
    }

    // Disallow duplicates.
    const fdcId = selectedOption.value;
    if (selectedFoods.some(f => f.fdcId === fdcId)) {
        return;
    }

    const description = selectedOption.textContent;
    selectedFoods.push({ fdcId, description, amount: 0 });
    renderSelectedFoods();
}

/**
 * Adds an input for each type of selected food.
 */
function renderSelectedFoods() {
    const selectedFoodsDiv = document.getElementById('selectedFoodsDiv');
    // TODO: Not ideal to completely wipe and rebuild every time something is added.
    // TODO: Loosely related, also need to add delete buttons to each entry.
    selectedFoodsDiv.innerHTML = '';

    selectedFoods.forEach((food, index) => {
        const div = document.createElement('div');
        div.className = 'food-entry';
        div.innerHTML = `
            <strong>${food.description}</strong><br>
            <label>Amount eaten (grams):</label>
            <input type="number" value="${food.amount}" onchange="updateAmount(${index}, this.value)">
        `;
        selectedFoodsDiv.appendChild(div);
    });
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

        const json = await fetchJson();
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
        const scale = food.amount / 100;
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