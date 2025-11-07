const apiKey = 'DEMO_KEY';
const selectedFoods = [];

async function searchFood() {
    const query = document.getElementById('searchTerm').value;
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const select = document.getElementById('foodResults');
        select.innerHTML = '';

        data.foods.forEach(food => {
            const option = document.createElement('option');
            option.value = food.fdcId;
            option.textContent = food.description;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching food data:', error);
    }
}

function addSelectedFood() {
    const select = document.getElementById('foodResults');
    const selectedOption = select.options[select.selectedIndex];
    if (!selectedOption) return;

    const fdcId = selectedOption.value;
    const description = selectedOption.textContent;

    if (selectedFoods.some(f => f.fdcId === fdcId)) return; // prevent duplicates

    selectedFoods.push({ fdcId, description, amount: 0 });
    renderSelectedFoods();
}

function renderSelectedFoods() {
    const container = document.getElementById('selectedFoods');
    container.innerHTML = '';

    selectedFoods.forEach((food, index) => {
        const div = document.createElement('div');
        div.className = 'food-entry';
        div.innerHTML = `
            <strong>${food.description}</strong><br>
            <label>Amount eaten (grams):</label>
            <input type="number" value="${food.amount}" onchange="updateAmount(${index}, this.value)">
        `;
        container.appendChild(div);
    });
}

function updateAmount(index, value) {
    selectedFoods[index].amount = parseFloat(value) || 0;
}

async function calculateAllMacros() {
    let totalProtein = 0, totalCarbs = 0, totalFat = 0;

    for (const food of selectedFoods) {
        const url = `https://api.nal.usda.gov/fdc/v1/food/${food.fdcId}?api_key=${apiKey}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const nutrients = data.foodNutrients;
            console.log(`Data for ${food.description}:`, data);

            let protein = 0, carbs = 0, fat = 0;
            nutrients.forEach(n => {
                console.log(`Nutrient:`, n);
                if (n.nutrient.id === 1003) protein = n.amount;
                if (n.nutrient.id === 1004) fat = n.amount;
                if (n.nutrient.id === 1005) carbs = n.amount;
            });

            // Food amount is typically 100g, but not in all cases.
            // Especially for branded foods, the amount may be different.
            // The existence of the "servingSize" key in the returned data means the service is specified.
            const scale = food.amount / 100;
            totalProtein += protein * scale;
            totalCarbs += carbs * scale;
            totalFat += fat * scale;
        } catch (error) {
            console.error(`Error fetching data for ${food.description}:`, error);
        }
    }

    const calories = (totalProtein * 4 + totalCarbs * 4 + totalFat * 9).toFixed(1);
    document.getElementById('results').innerHTML = `
        <h3>Total Macros</h3>
        <p><strong>Protein:</strong> ${totalProtein.toFixed(1)}g</p>
        <p><strong>Carbs:</strong> ${totalCarbs.toFixed(1)}g</p>
        <p><strong>Fat:</strong> ${totalFat.toFixed(1)}g</p>
        <p><strong>Calories:</strong> ${calories}</p>
    `;
}