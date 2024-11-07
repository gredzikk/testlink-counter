// ==UserScript==
// @name         Custom Action on Button Click with Detailed Count
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Display detailed count of positive, blocked, and negative tests in the bottom right corner of the page, updated on each click.
// @author       You
// @match        https://testlinkmt.apator.com/lib/execute/execSetResults.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to add custom action
    function addCustomAction(button) {
        button.addEventListener('click', function() {
            const testId = button.name.match(/\d+/)[0];
            const status = button.id.match(/fastExec([pbf])/)[1];
            const dlmsValue = extractDlmsValue();
            const urlParams = extractUrlParams();

            incrementClickCount(status, testId, dlmsValue, urlParams);

            updateTestCountDisplay();
        });
    }

    function extractDlmsValue() {
        const dlmsElement = document.querySelector('.exec_tc_title');
        if (dlmsElement) {
            const match = dlmsElement.textContent.match(/dlms-\d+/);
            if (match) {
                return match[0];
            }
        }
        return 'dlms-unknown';
    }

    function extractUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            version_id: params.get('version_id') || 'unknown',
            id: params.get('id') || 'unknown',
            tplan_id: params.get('tplan_id') || 'unknown',
            setting_build: params.get('setting_build') || 'unknown'
        };
    }

    function incrementClickCount(status, testId, dlmsValue, urlParams) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const lastDateKey = 'lastDate';
        const lastDate = localStorage.getItem(lastDateKey);
        if (lastDate !== today) {
            localStorage.setItem(lastDateKey, today);
            localStorage.setItem('positiveCount', 0);
            localStorage.setItem('blockedCount', 0);
            localStorage.setItem('negativeCount', 0);
        }

        const statusKeyMap = {
            p: 'positiveCount',
            b: 'blockedCount',
            f: 'negativeCount'
        };
        const currentCount = parseInt(localStorage.getItem(statusKeyMap[status])) || 0;
        localStorage.setItem(statusKeyMap[status], currentCount + 1);
    }

    function getCountsForToday() {
        return {
            positiveCount: parseInt(localStorage.getItem('positiveCount')) || 0,
            blockedCount: parseInt(localStorage.getItem('blockedCount')) || 0,
            negativeCount: parseInt(localStorage.getItem('negativeCount')) || 0
        };
    }

    function updateTestCountDisplay() {
        const counts = getCountsForToday();

        const testCountDisplay = document.getElementById('testCountDisplay');
        testCountDisplay.innerHTML = `
            <b>Wykonania testów dzisiaj:</b><br>
            - Pozytywne: ${counts.positiveCount}<br>
            - Zablokowane: ${counts.blockedCount}<br>
            - Negatywne: ${counts.negativeCount}
        `;
    }

    function createTestCountDisplay() {
        const displayDiv = document.createElement('div');
        displayDiv.id = 'testCountDisplay';
        displayDiv.style.position = 'fixed';
        displayDiv.style.bottom = '10px';
        displayDiv.style.right = '10px';
        displayDiv.style.padding = '15px';
        displayDiv.style.backgroundColor = '#f9f9f9';
        displayDiv.style.border = '1px solid #ddd';
        displayDiv.style.borderRadius = '8px';
        displayDiv.style.boxShadow = '0px 4px 8px rgba(0, 0, 0, 0.1)';
        displayDiv.style.fontSize = '14px';
        displayDiv.style.zIndex = '1000';
        displayDiv.style.color = '#333';

        document.body.appendChild(displayDiv);

        updateTestCountDisplay();
    }

    function addDownloadButton() {
        const button = document.createElement('button');
        button.textContent = 'Pobierz dzisiejsze wykonania';
        button.style.position = 'fixed';
        button.style.bottom = '50px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'green';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', generateCSV);
        document.body.appendChild(button);

        button.addEventListener('mouseover', function() {
            button.style.backgroundColor = '#45a049';
        });
        button.addEventListener('mouseout', function() {
            button.style.backgroundColor = '#4CAF50';
        });
    }

    function addClearButton() {
        const button = document.createElement('button');
        button.textContent = 'Resetuj lokalne dane';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#f44336';
        button.style.color = 'red';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', clearLocalStorage);
        document.body.appendChild(button);

        button.addEventListener('mouseover', function() {
            button.style.backgroundColor = '#e53935';
        });
        button.addEventListener('mouseout', function() {
            button.style.backgroundColor = '#f44336';
        });
    }

    function clearLocalStorage() {
        if (confirm('Na pewno chcesz usunąć pamięć podręczną? Akcja jest nieodwracalna.')) {
            localStorage.clear();
            alert('Pamięć podręczna została wyczyszczona.');
            updateTestCountDisplay();  // Update display after clearing
        }
    }

    const buttons = document.querySelectorAll('img[id^="fastExec"]');
    buttons.forEach(addCustomAction);

    createTestCountDisplay();  // Create the test count display panel
    addDownloadButton();
    addClearButton();
})();
