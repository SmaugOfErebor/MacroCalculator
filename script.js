const caloriesPerProtein = 4;
const caloriesPerCarb = 4;
const caloriesPerFat = 9;

function calculate() {
    const gramsProtein = parseFloat(document.getElementById('protein').value) || 0;
    const gramsCarb = parseFloat(document.getElementById('carbs').value) || 0;
    const gramsFat = parseFloat(document.getElementById('fat').value) || 0;

    const calories = (gramsProtein * caloriesPerProtein) + (gramsCarb * caloriesPerCarb) + (gramsFat * caloriesPerFat);
    const totalMacroGrams = gramsProtein + gramsCarb + gramsFat;

    let proteinPercent = 0;
    let carbsPercent = 0;
    let fatPercent = 0;

    if (totalMacroGrams) {
        proteinPercent = ((gramsProtein / totalMacroGrams) * 100).toFixed(1);
        carbsPercent = ((gramsCarb / totalMacroGrams) * 100).toFixed(1);
        fatPercent = ((gramsFat / totalMacroGrams) * 100).toFixed(1);
    }

    document.getElementById('results').innerHTML = `
        <h3>Results</h3>
        <p><strong>Total Calories:</strong> ${calories}</p>
        <p><strong>Protein:</strong> ${proteinPercent}%</p>
        <p><strong>Carbs:</strong> ${carbsPercent}%</p>
        <p><strong>Fat:</strong> ${fatPercent}%</p>
    `;
}