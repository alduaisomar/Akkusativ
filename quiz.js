var nMaxQuestion;
var nCurQuestion;
var divChoice = '';
var bCurChoiceSelectedIsCorrect = false;
var nScore;
var sFinalMessage;

function initEval() {
	$('#evaluation').show();
	$('#img-slide').hide();

	$('#evaluation-start').show();
	$('#evaluation-question').hide();
	$('#evaluation-end').hide();
}

function startEval() {
	nCurQuestion = -1;
	nMaxQuestion = aQuiz.questions.length;
	nScore = 0;

	$('#evaluation-start').hide();
	$('#evaluation-question').show();
	$('#evaluation-end').hide();
	$('#nav-bottom').hide();

	nextQuestion();
}

function setQuestion() {
	var _maxChoice = 3; // fixed because... yes
	var _thisChoice = '';
	

	$('.question').html(aQuiz.questions[nCurQuestion].question);

	if (divChoice === '') divChoice = $('.choices').html();
	$('.choices').html(''); // limpa
	//aQuiz.questions['choice'+nCurQuestion].length
	for (var i = 0; i < _maxChoice; i++) {
		_thisChoice = divChoice;
		_thisChoice = _thisChoice.replace('[label]', aQuiz.questions[nCurQuestion]['choice'+(i+1)]);
		if (aQuiz.questions[nCurQuestion]['choice'+(i+1)+'IsCorrect'] === 'true') _thisChoice = _thisChoice.replace('[value]', 'true');
		$('.choices').append(_thisChoice);
	}

	toggleConfirm(false);
	bCurChoiceSelectedIsCorrect = false;
}

function onChoiceClick(_correct) {
	toggleConfirm(true);
	bCurChoiceSelectedIsCorrect = (_correct === 'true');
}

function toggleConfirm(_enabled) {
	if (!_enabled) {
		$('#button-confirm').attr('disabled', 'true');
	} else {
		$('#button-confirm').removeAttr('disabled');
	}
}

function confirmQuestion() {
	if (bCurChoiceSelectedIsCorrect) nScore++;
	nextQuestion();
}

function nextQuestion() {
	if ((nCurQuestion+1) < nMaxQuestion) {
		nCurQuestion++;
		setQuestion();
	} else {
		endEval();
	}
}

function endEval() {

	var _percent = Math.round((nScore / nMaxQuestion) * 100);
	if (!sFinalMessage) sFinalMessage = $('#evaluation-end').html();

	var _message = sFinalMessage;
	_message = _message.replace('{percent}', _percent);
	_message = _message.replace('{score}', nScore);
	_message = _message.replace('{maxquestion}', nMaxQuestion);

	$('#evaluation-end').html(_message);

	$('#evaluation-question').hide();
	$('#evaluation-end').show();
	$('#nav-bottom').show();

	doSetSCOCompleted(_percent);

}