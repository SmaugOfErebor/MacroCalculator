import { fetchJson } from '/components/utils.js';
import { openFoodSelector } from '/components/food_search_modal.js';

const selectedFoods = [];

const apiKeyInputId = 'apiKeyInput';
const apiKeyInput = document.getElementById(apiKeyInputId);
// Default to the demo API key.
if (!localStorage.getItem(apiKeyInput.dataset.storageKey)) {
    localStorage.setItem(apiKeyInput.dataset.storageKey, 'DEMO_KEY');
}

const localStorageInputIds = [
    apiKeyInputId,
    'ageInput',
    'weightInput',
    'heightInput',
    'proteinPercentInput',
    'carbohydratePercentInput',
    'fatPercentInput'
];

// Load input values from local storage and add event listeners to write back to local storage on input.
localStorageInputIds.forEach(inputId => {
    let input = document.getElementById(inputId);
    input.value = localStorage.getItem(input.dataset.storageKey);
    input.addEventListener('input', (e) => {
        localStorage.setItem(input.dataset.storageKey, e.target.value);
    })
});

// Add event listeners to all the goal mode radio buttons to store the selection in local storage.
const goalRadioGroupName = 'goalRadio';
const goalModeStorageKey = 'goalMode';
const goalRadios = document.querySelectorAll(`input[name="${goalRadioGroupName}"]`);
goalRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            localStorage.setItem(goalModeStorageKey, radio.value);
        }
    });
});

// Load the selected goal mode. Default to maintaining weight.
const goalMode = localStorage.getItem(goalModeStorageKey);
if (goalMode) {
    document.querySelector(`input[name="${goalRadioGroupName}"][value="${goalMode}"]`).checked = true;
} else {
    document.querySelector(`input[name="${goalRadioGroupName}"][value="maintainWeight"]`).checked = true;
}

document.querySelector('.add-eaten-food-btn').addEventListener('click', addEatenFood);

/**
 * Opens the food selector modal and adds the selected food to the eaten foods list.
 */
async function addEatenFood() {
    const food = await openFoodSelector(apiKeyInput.value);

    if (!food) {
        console.log("User canceled");
        return;
    }

    console.log(food);

    // Disallow duplicates.
    const fdcId = food.fdcId;
    if (selectedFoods.some(f => f.fdcId === fdcId)) {
        // TODO: Inform the user that they tried to add a duplicate.
        return;
    }

    // Add the food JSON to the selected foods array.
    selectedFoods.push(food);

    // Add a selected food template visually corresponding to this new selected food.
    const eatenFoodsDiv = document.getElementById('eatenFoodsDiv');
    const newSelectedFood = new SelectedFoodItem(food);
    eatenFoodsDiv.appendChild(newSelectedFood.element);
}

document.querySelector('.calculate-macros-btn').addEventListener('click', calculateAllMacros);

/**
 * Calculates the sum of macronutirents and calories from all selected foods.
 */
async function calculateAllMacros() {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    // Sum all of the macronutrients in all selected foods.
    for (const food of selectedFoods) {
        const url = `https://api.nal.usda.gov/fdc/v1/food/${food.fdcId}?api_key=${apiKeyInput.value}`;

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