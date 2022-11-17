const JSERVICE_URL = "http://jservice.io/api/";
// categories is the main data structure for the app; it looks like this:
// https://jservice.io/api/categories?offset=27722 total
//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]



let loading = false;

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category id
 */
//done
function getCategoryIds() {
    let categories = [];
    for(let i = 0; i < 6; i++) {
        categories.push(Math.floor(Math.random() * 27722));
    }
    return categories;
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

function getCategory(catId) {
    let {id, title, clues_count, clues} = catId;
    
    let cluesArr = clues.map(obj => {
        let {question, answer} = obj;
        return {question, answer, showing: null};
    })

    return {id, title, clues_count, cluesArr};
    // return catId.reduce((cat, next) => {
    //     let {id, title, clues_count} = next;
    //     return [...cat, {title, clues_count}]
    // }, [])
}

// call api endpoint
async function callApi(id) {
    try {
        let {data} = await axios.get(`${JSERVICE_URL}categories`, { params: { offset: id}});
        if(data[0].clues_count < 5) { // defalut data for categories that have less than 5 clues
            data = [{id: 8777, title: "rhymes with mouse", clues_count: 5}];
        }// get the first 5 clues from the category
        let {data: clues} = await axios.get(`${JSERVICE_URL}clues`, {params:{category: data[0].id}})
        // random clues needs to be implemented soon
        return getCategory({...data[0], clues});
    } catch (error) {
        alert('Something went wrong please refresh the page');
        throw new Error(error.message)
    }
}

// request data from api and return an object with all data
async function aggregateData() {
    setTimeout(()=>allData=false, 10000);
    // iterate catogories and await results
    return await Promise.all(getCategoryIds().map(callApi));
}

// generates HTML data for the table
function generateTd(arr, idx) {
    return arr.reduce((td, nextClue) => (
    `${td}
    <td>?
        <p class='Question' style='display: none;' data-showing='null'>${nextClue.cluesArr[idx].question}</p>
        <p class='Answer' style='display: none;' data-showing='null'>${nextClue.cluesArr[idx].answer}</p>
    </td>`
    ),'');
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */
async function fillTable() {
    $('.jeopardy-table').remove();

    let catObjArr = await aggregateData();
    // generate the HTML table head data
    let theads = catObjArr.reduce((th, category) => `${th}<th>${category.title}</th>`,'');
    
    let tdArr = [];
    // genate HTML td data
    for(let i = 0; i < 5; i++) {
        tdArr.push(generateTd(catObjArr, i));
    }
    
    let tdHTML = tdArr.reduce((textContent, nextTd) => `${textContent}<tr>${nextTd}</tr>`,'');

    let $table = $(`
    <table class='jeopardy-table'>
        <thead class='table-head'>
            <tr>
                ${theads}
            </tr>
        </thead>
        <tbody>
                ${tdHTML}
        </tbody>
    </table>`);

    hideLoadingView();
    $('body').append($table);
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    let $target = $(evt.target);

    // triggers if BUTTON is clicked
    if($target.prop("tagName") === 'BUTTON') {
        if(!loading) showLoadingView();
        fillTable();
    }
    // triggers if TD is clicked
    if($target.prop("tagName") === 'TD') {
        let $question = $target.children('.Question');

        if($question.attr('data-showing') === 'null') {
            $question.show(); // display the Question
            $question.attr('data-showing', 'showing'); // change attribute to showing
            $target.contents().get(0).remove(); // remove the ? textNode
        }
    }
    // triggerse if P tag is clicked
    if($target.prop("tagName") === 'P') {
        let $answer = $target.siblings(); // get sibling of question

        if($answer.attr('data-showing') === 'null') {
            $answer.show(); // show answer
            $answer.attr('data-showing', 'showing'); // display showing
            $target.hide(); // hide question
        } 
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    loading = true;
    $('.start').text('Loading...')
    $('body').append($(`<div class="loading"></div>`));
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    loading = false;
    $('.start').text('Start')
    $('.loading').remove();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    $('body').append($(`<h1 class="header">Jeopardy</h1><button class="start">${(loading) ? 'Loading' : 'Start'}</button>`))
    $('body').on('click', handleClick);
}

/** On click of start / restart button, set up game. */

// TODO

/** On page load, add event handler for clicking clues */

// TODO
$(setupAndStart)