/*
File: main.js
GUI Assignment: Creating A Dynamic Multiplication Table with jQuery Validation plugin
Nancy Vi, UMass Lowell Computer Science, Nancy_Vi@student.uml.edu
Copyright (c) 2025 by Nancy. All rights reserved.

Description: This is the js file for assignment 4 part 2, it contains the behavior of the page that 
handles the form subission, input validation (ensures input values are valid, whole, within 
-50 to 50, and the maximums are greater than or equal to the minimums). This assignments builds off 
the previous part and incorporates jQuery UI Slider and Tab Widgets.
Updated by NV on November 26, 2025 at 11:59 PM

*/

// Initializing constants/elements
const MIN_BOUND = -50;
const MAX_BOUND = 50;

// Tab ID counter
let tabCounter = 1;

// Execute when the DOM is fully loaded
$(document).ready(function() {

    /* Validation tests for the user inputs. It'll check whether the user inputs are valid numbers (not symbols, empty. etc.),
    the values are whole numbers, and the maximums are greater than or equal to the minimums.
    */
    $.validator.addMethod("isInteger", function(value, element) {
        return this.optional(element) || /^-?\d+$/.test(value);
    }, "Please enter a positive or negative integer.");

    $.validator.addMethod("greaterThan", function(value, element, param) {
        var target = $(param);
        if (this.settings.onfocusout && target.not(".validate-lessThan-blur").length) {
            target.addClass("validate-lessThan-blur").on("blur.validate-lessThan", function() {
                $(element).valid();
            });
        }
        return parseFloat(value) >= parseFloat(target.val());
    }, "Maximum value must be greater than or equal to minimum.");


    // Initialize the Validation Plugin on the form
    $("#table-form").validate({
        rules: {
            min_col: { 
                required: true,
                number: true,
                isInteger: true,
                range: [MIN_BOUND, MAX_BOUND]
            },
            max_col: { 
                required: true,
                number: true,
                isInteger: true,
                greaterThan: "#min_col",
                range: [MIN_BOUND, MAX_BOUND]
            },
            min_row: {
                required: true,
                number: true,
                isInteger: true,
                range: [MIN_BOUND, MAX_BOUND]
            },
            max_row: {
                required: true,
                number: true,
                isInteger: true,
                greaterThan: "#min_row",
                range: [MIN_BOUND, MAX_BOUND]
            } 
        },

        // Error messaging
        messages: {
            min_col: {
                required: "Enter a valid whole number in this field.",
                range: "Numbers must be between -50 and 50.",
                isInteger: "Please enter a whole number."
            },
            max_col: {
                required: "Enter a valid whole number in this field.",
                range: "Numbers must be between -50 and 50.",
                isInteger: "Please enter a whole number.",
                greaterThan: "Maximum Column Value must be greater than or equal to the Minimum Column Value."
            },
            min_row: {
                required: "Enter a valid whole number.",
                range: "Numbers must be between -50 and 50.",
                isInteger: "Please enter a whole number."
            },
            max_row: {
                required: "Enter a valid whole number.",
                range: "Numbers must be between -50 and 50.",
                isInteger: "Please enter a whole number.",
                greaterThan: "Max Row must be >= Min Row."
            }
        },

        // If all validation tests pass, then submit function runs
        submitHandler: function(form) {
            const params = getFormValues();
            const tableHTML = generateTableHTML(params);
            
            // Add the table to a new saved tab
            addNewSavedTab(tableHTML, params); 
            return false;
        },
          // Ensures that validation runs when a slider/input changes and updates error messages
        onkeyup: function(element) { $(element).valid(); },
        onfocusout: function(element) { $(element).valid(); }
    });
    
    // Initialize the jQuery UI Tabs widget
    const $tabs = $("#tabs").tabs({
        cache: true, 
        active: -1
    });

    function addNewSavedTab(tableHTML, params) {
        const id = "table-tab-" + tabCounter;
        const label = `Table ${tabCounter}`;
        
        // Add tab header
        $tabs.find(".ui-tabs-nav").append(
            `<li><a href="#${id}">${label}</a> <span class="ui-icon ui-icon-close" role="presentation">Remove Tab</span></li>`
        );
        
        $tabs.append(`<div id="${id}"><div class="table-container-wrapper">${tableHTML}</div></div>`);
        
        // Refresh the tabs widget and set the new tab as active
        $tabs.tabs("refresh");
        const newTabIndex = $tabs.find(".ui-tabs-nav li").length - 1;
        $tabs.tabs("option", "active", newTabIndex); 
        
        tabCounter++;
    }

    // Delete current tab
    $tabs.on("click", "span.ui-icon-close", function() {
        const $li = $(this).closest("li");
        const panelId = $li.attr("aria-controls");
        
        $li.remove();
        $("#" + panelId).remove();
        
        $tabs.tabs("refresh");
    });

    // Deletes current active tab
    $("#delete-current-tab").on("click", function() {
        const $li = $tabs.find(".ui-tabs-nav li.ui-state-active");
        
        if ($li.length === 0) {
            console.error("No saved table tab is currently active to delete."); 
            return;
        }
        const panelId = $li.attr("aria-controls");
        
        $li.remove();
        $("#" + panelId).remove();
        
        $tabs.tabs("refresh");
    });

    // Delete all tables
    $("#delete-all-tables").on("click", function() {
        const $allTabs = $tabs.find(".ui-tabs-nav li");
        
        if ($allTabs.length === 0) {
            console.error("There are no saved tables to delete.");
            return;
        }

        $allTabs.each(function() {
            const panelId = $(this).attr("aria-controls");
            $("#" + panelId).remove();
            $(this).remove(); 
        });
        
        tabCounter = 1;
        $tabs.tabs("refresh");
    });

    // jQuery UI Sliders 
    const inputIds = ["min_col", "max_col", "min_row", "max_row"];
    
    function initializeSlider(inputId) {
        const $input = $(`#${inputId}`);
        const $slider = $(`#slider-${inputId}`);

        $slider.slider({
            range: "min",
            min: MIN_BOUND,
            max: MAX_BOUND,
            value: 0, 

            slide: function(event, ui) {
                $input.val(ui.value);
                $input.valid();
                $input.trigger('input');
            },
            // Handler for when the slider stops moving
            change: function(event, ui) {
                $input.val(ui.value);
                $input.valid();
                $input.trigger('input'); 
            }
        });

        // Handler for when the text input field value changes
        $input.on("input change", function() {
            const value = parseInt($input.val());

            if ($input.valid() && !isNaN(value) && value >= MIN_BOUND && value <= MAX_BOUND) {
                $slider.slider("value", value);

                generateLiveTable();
            } else {
                // Clear the live table if the inputs are invalid or incomplete
                $('#live-table-container').html('');
            }
        });
        
        $input.val(0); 
    }

    // Initialize sliders
    inputIds.forEach(initializeSlider);
    
    function getFormValues() {
        return {
            minCol: parseInt($('#min_col').val()),
            maxCol: parseInt($('#max_col').val()),
            minRow: parseInt($('#min_row').val()),
            maxRow: parseInt($('#max_row').val())
        };
    }

    function generateTableHTML(params) {

        const { minCol, maxCol, minRow, maxRow } = params;
        
        let tableHTML = '<table class="multi_table">';
        
        tableHTML += '<thead><tr><th></th>';

        for (let c = minCol; c <= maxCol; c++) {
            tableHTML += `<th>${c}</th>`;
        }

        tableHTML += '</tr></thead>';
        tableHTML += '<tbody>';

        for (let r = minRow; r <= maxRow; r++) {
            tableHTML += '<tr>';
            tableHTML += `<th>${r}</th>`;

            for (let c = minCol; c <= maxCol; c++) {
                tableHTML += `<td>${r * c}</td>`;
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</tbody></table>';

        return tableHTML;
    }

    function generateLiveTable() {
        // Only generate if the entire form is valid
        if ($("#table-form").valid()) {
            const params = getFormValues();
            const tableHTML = generateTableHTML(params);
            
            $('#live-table-container').html(tableHTML);
        } else {
            $('#live-table-container').html('');
        }
    }
    
    $("#table-form").validate().resetForm(); 
    generateLiveTable();

});