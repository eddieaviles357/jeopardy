const BASE_API_URL = "http://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES = 5;

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  try {
    // ask for 50 categories so we can pick random max is 100
    let {data} = await axios.get(`${BASE_API_URL}categories`, { params: { count: 50 } });

    let catIds = data.map(category => category.id);
    // choose a random number from lodash library
    return _.sampleSize(catIds, NUM_CATEGORIES);

  } catch (err) {
    console.log("ERROR IN getCategoryIds", err)
  }
}

// Return object with data about a category:

async function getCategory(catId) {
  try {
    const options = { params: { id: catId } };
    let {data: category} = await axios.get(`${BASE_API_URL}category`, options);
    // choose random clue using lodash library
    let clues = _.sampleSize(category.clues, NUM_CLUES).map(
      ({question, answer}) => ( { question, answer, showing: null } )
    );
    const { title } = category;
    return { title, clues };
  } catch (err) {
    console.log("ERROR in getCategory", err);
  }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - <thead> will be filled with <tr>, and <td> for each category
 * - <tbody> will be filled with NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (shows a "?" initially.)
 */

async function fillTable() {
  hideLoadingView();

  // Add row with headers for categories
  let $tr = $("<tr>");
  for (let category of categories) {
    $tr.append($("<th>").text(category.title));
  }
  $("#jeopardy thead").append($tr);

  // Add rows with questions for each category
  $("#jeopardy tbody").empty();
  for (let clueIdx = 0; clueIdx < NUM_CLUES; clueIdx++) {
    let $tr = $("<tr>");
    for (let catIdx = 0; catIdx < NUM_CATEGORIES; catIdx++) {
      $tr.append(
        $("<td>")
          .attr("id", `${catIdx}-${clueIdx}`)
          .append($("<i>").addClass("fas fa-question-circle fa-3x"))
      );
    }
    $("#jeopardy tbody").append($tr);
  }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  let $tgt = $(evt.target);
  let id = $tgt.attr("id");
  let [catId, clueId] = id.split("-");
  let clue = categories[catId].clues[clueId];

  let msg;

  if (!clue.showing) {
    msg = clue.question;
    clue.showing = "question";
  } else if (clue.showing === "question") {
    msg = clue.answer;
    clue.showing = "answer";
    $tgt.addClass("disabled");
  } else {
    // already showing answer; ignore
    return;
  }

  // Update text of cell
  $tgt.html(msg);
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  // clear the board
  $("#jeopardy thead").empty();
  $("#jeopardy tbody").empty();

  // show the loading icon
  $("#spin-container").show();
  $("#start").addClass("disabled").text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#start").removeClass("disabled").text("Restart!");
  $("#spin-container").hide();
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  try {
    let isLoading = $("#start").text() === "Loading!";
    if (!isLoading) {
      showLoadingView();
  
      let catIds = await getCategoryIds();
  
      categories = [];
  
      for (let catId of catIds) {
        categories.push(await getCategory(catId));
      }
  
      fillTable();
    }
    
  } catch (err) {
    console.log("ERROR in setUpAndStart", err);
  }

}

/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$(async function() {
  $("#jeopardy").on("click", "td", handleClick);
});
