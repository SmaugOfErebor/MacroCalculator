/**
 * Performs the HTTP response fetch and awaiting the JSON from the response.
 * In the future, will give detailed error feedback to the user.
 * @param {string} url
 * @returns Either undefined in the case of an error of the JSON from the HTTP response.
 */
export async function fetchJson(url) {
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