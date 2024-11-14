// ==UserScript==
// @name         Custom Action on Button Click with Detailed Count and CSV Download
// @namespace    http://tampermonkey.net/
// @version      1.17
// @description  Display detailed count of positive, blocked, and negative tests in the bottom right corner, with CSV download and local storage reset options.
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
        const today = now.toLocaleDateString('en-CA').split('T')[0];

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

        // Save detailed click data with the current counts
        const clickDetailsKey = `clickDetails_${now.toLocaleDateString('en-CA')}_${status}_${testId}`;
        const counts = getCountsForToday();
        localStorage.setItem(clickDetailsKey, JSON.stringify({
            datetime: now.toLocaleDateString('en-CA'),
            tests_today: counts.positiveCount + counts.blockedCount + counts.negativeCount,
            status,
            dlmsValue,
            testId,
            version_id: urlParams.version_id,
            id: urlParams.id,
            tplan_id: urlParams.tplan_id,
            setting_build: urlParams.setting_build
        }));
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

    function generateCSV() {
        const csvRows = ['datetime;tests_today;status;dlms_value;test_id;version_id;id;tplan_id;setting_build'];
        const today = new Date().toLocaleDateString('en-CA');
        const clickDetailsArray = [];

        // Iterate through local storage to collect click details for today
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('clickDetails_')) {
                const clickDetails = JSON.parse(localStorage.getItem(key));
                if (clickDetails.datetime.startsWith(today)) {
                    clickDetailsArray.push(clickDetails);
                }
            }
        }

        clickDetailsArray.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        // Prepare CSV rows with the sum of all tests today (positive, blocked, negative)
        clickDetailsArray.forEach(clickDetails => {
            const counts = getCountsForToday();  // Get updated counts for today
            csvRows.push(`${clickDetails.datetime};${counts.positiveCount + counts.blockedCount + counts.negativeCount};${clickDetails.status};${clickDetails.dlmsValue};${clickDetails.testId};${clickDetails.version_id};${clickDetails.id};${clickDetails.tplan_id};${clickDetails.setting_build}`);
        });

        const csvContent = csvRows.join('\n');
        downloadCSV(csvContent);
    }

    function downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wykonania_testow' + now.toLocaleDateString('en-CA') + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearLocalStorage() {
        if (confirm('Na pewno chcesz usunąć pamięć podręczną? Akcja jest nieodwracalna.')) {
            localStorage.clear();
            alert('Pamięć podręczną została wyczyszczona.');
            updateTestCountDisplay();  // Update display after clearing
        }
    }

    function addDownloadButton() {
        const button = document.createElement('button');
        button.textContent = 'Pobierz dzisiejsze wykonania';
        button.style.position = 'fixed';
        button.style.bottom = '50px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = 'white';  // White background
        button.style.color = 'black';  // Black text
        button.style.border = '1px solid #ddd';  // Border
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', generateCSV);
        document.body.appendChild(button);
    }

    function addClearButton() {
        const button = document.createElement('button');
        button.textContent = 'Resetuj lokalne dane';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = 'white';  // White background
        button.style.color = 'black';  // Black text
        button.style.border = '1px solid #ddd';  // Border
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', clearLocalStorage);
        document.body.appendChild(button);
    }

    const buttons = document.querySelectorAll('img[id^="fastExec"]');
    buttons.forEach(addCustomAction);

    createTestCountDisplay();  // Create the test count display panel
    addDownloadButton();       // Add CSV download button
    addClearButton();          // Add clear local storage button
})();
