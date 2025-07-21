/**
 * filterManager.js
 * Handles toggling the filter UI and applying shop filters
 */


export const filterManager = {
    init: function({ tabManager, panelManager, dataStore, map, urlRouter, localIcon}) {
        const filterBtn = document.getElementById('filterToggleBtn');
        const filterPanel = document.getElementById('filterPanel');
        const tabContent = document.getElementById('shopTabContent');
        const searchResultsPanel = document.getElementById('search-results-panel');

        const applyBtn = document.getElementById('applyFilterBtn');
        const cancelBtn = document.getElementById('cancelFilterBtn');

        if (!filterBtn || !filterPanel) return;

        filterBtn.addEventListener('click', () => {
            // Hide tabs and search results, show filter panel
            tabContent.style.display = 'none';
            if (searchResultsPanel) searchResultsPanel.style.display = 'none';
            panelManager.hideAllPanels();
            filterPanel.style.display = 'block';
        });

        cancelBtn.addEventListener('click', () => {
            // Restore tabs and hide filter panel
            tabContent.style.display = '';
            if (searchResultsPanel) searchResultsPanel.style.display = 'none';
            filterPanel.style.display = 'none';
        });

        applyBtn.addEventListener('click', () => {
            const filters = {
                wifi: document.getElementById('filterWifi').checked,
                outlets: document.getElementById('filterOutlets').checked,
                long_hours: document.getElementById('filterLongHours').checked,
                parking: document.getElementById('filterParking').checked,
                openNow: document.getElementById('filterOpenNow').checked,
                time: document.getElementById('filterEnableTime').checked
                ? {
                    hour: document.getElementById('filterHour').value,
                    minute: document.getElementById('filterMinute').value,
                    ampm: document.getElementById('filterAMPM').value
                }
                : null
            };
            
            if (filters.time && (!filters.time.hour || !filters.time.minute || !filters.time.ampm)) {
                filters.time = null;
            }

            console.log("Applied Filters:", filters);
            console.log("All Shops Before Filter:", dataStore.allSearchableShops);
            
            const filteredShops = dataStore.filterShops(filters);
            console.log("Applied Shops:", filteredShops);
            
            panelManager.displayFilteredResults(
                filteredShops,
                map,
                dataStore,
                localIcon,
                urlRouter
            );

            // Switch back to regular UI
            filterPanel.style.display = 'none';
            tabContent.style.display = 'none';
            if (searchResultsPanel) searchResultsPanel.style.display = 'block';
        });
        const clearBtn = document.getElementById('clearFiltersBtn');
        clearBtn.addEventListener('click', () => {
            ['filterWifi', 'filterOutlets', 'filterLongHours', 'filterParking', 'filterOpenNow', 'filterEnableTime'].forEach(id => {
                document.getElementById(id).checked = false;
            });

            // Reset selects to default
            document.getElementById('filterHour').selectedIndex = 0;
            document.getElementById('filterMinute').selectedIndex = 0;
            document.getElementById('filterAMPM').selectedIndex = 0;

            const allShops = dataStore.allSearchableShops;
            panelManager.displayFilteredResults(allShops, map, dataStore, localIcon, urlRouter);
            filterPanel.style.display = 'none';
            tabContent.style.display = 'none';
            if (searchResultsPanel) searchResultsPanel.style.display = 'block';
        });

    }
};