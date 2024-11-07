// ==UserScript==
// @name         Custom Action on Button Click with Detailed Count
// @namespace    http://tampermonkey.net/
// @version      1.13
// @description  Add custom actions to button clicks on the webpage, keeping track of positive, blocked, and negative test counts separately, and exporting daily totals to CSV.
// @author       You
// @match        https://testlinkmt.apator.com/lib/execute/execSetResults.php*
// @grant        none
// ==/UserScript==

//GEJ GEJ NIGGER GEJ

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

            const { positiveCount, blockedCount, negativeCount } = getCountsForToday();

            alert(`Testy wykonane dzisiaj:\n- Pozytywne: ${positiveCount}\n- Zablokowane: ${blockedCount}\n- Negatywne: ${negativeCount}`);
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
        const datetime = now.toISOString();

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

        const clickDetailsKey = `clickDetails_${datetime}_${status}_${testId}`;
        localStorage.setItem(clickDetailsKey, JSON.stringify({
            datetime,
            status,
            testId,
            dlmsValue,
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

    function generateCSV() {
        const csvRows = ['datetime;tests_today;status;dlms_value;test_id;version_id;id;tplan_id;setting_build'];
        const today = new Date().toISOString().split('T')[0];
        const clickDetailsArray = [];

        // Calculate today's total test count by summing up all statuses
        const counts = getCountsForToday();
        const testsTodayCount = counts.positiveCount + counts.blockedCount + counts.negativeCount;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('clickDetails_')) {
                const clickDetails = JSON.parse(localStorage.getItem(key));
                if (clickDetails.datetime.startsWith(today)) {
                    clickDetails.tests_today = testsTodayCount; // Add today's test count to each entry
                    clickDetailsArray.push(clickDetails);
                }
            }
        }

        clickDetailsArray.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        clickDetailsArray.forEach(clickDetails => {
            csvRows.push(`${clickDetails.datetime};${clickDetails.tests_today};${clickDetails.status};${clickDetails.dlmsValue};${clickDetails.testId};${clickDetails.version_id};${clickDetails.id};${clickDetails.tplan_id};${clickDetails.setting_build}`);
        });

        const csvContent = csvRows.join('\n');
        downloadCSV(csvContent);
    }

    function downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wykonania_testow.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearLocalStorage() {
        if (confirm('Na pewno chcesz usunąć pamięć podręczną? Akcja jest nieodwracalna.')) {
            localStorage.clear();
            alert('Pamięć podręczna została wyczyszczona.');
        }
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

    const buttons = document.querySelectorAll('img[id^="fastExec"]');
    buttons.forEach(addCustomAction);

    addDownloadButton();
    addClearButton();
})();
