
var nCurPage = 1;
var sBaseURL;
var sBaseURLSlides;
var sBaseURLMedia;
var isHTTP;
var hasEvaluation = false;
var aMedia;

function doSetupCourse() {

	// 1. verifica se tem config.js
	if (typeof(nMaxPage) !== 'undefined') {

		console.log('1. tem config.js');

		// 1.1 confirmado config.js
		// - então pega os seguintes dados de lá
		// - nMaxpage
		// - sCourseName
		// - aQuiz (se existir quiz no curso)

		// default para pacote local
		sBaseURL 		= '';
		sBaseURLSlides 	= 'slides/';
		sBaseURLMedia 	= 'media/';


		doInitCourse();

	} else {

		// 2. tenta verificar se cid no parametro; se sim, busca este dados da API
		var _cid = getUrlVars()['cid'];
		if (_cid !== undefined) {

			console.log('2. tem cid (chama API)');

			doGetCourseData(_cid, function(_response) {
				// carrega variávies conforme dados vindos da API
				nMaxPage 		= _response.data.maxSlide;
				sCourseName 	= _response.data.name;
				aQuiz 			= _response.data.quiz; // aqui se não tiver talvez tenha undefined
				aMedia			= _response.data.media;
				sBaseURL		= _response.data.previewCourseURL.substr(_response.data.previewCourseURL.indexOf('baseurl=', 0)+8, _response.data.previewCourseURL.length);
				sBaseURLSlides 	= sBaseURL;
				sBaseURLMedia 	= sBaseURL;
				doInitCourse();

			});

		} else {

			console.log('3. vai por querystring...');

			// 3. se não achou nenhum dos dois, busca da querystring
			// (último caso, se não houver, não tem como carregar o curso)
			nMaxPage 	= getUrlVars()['maxslide'];
			sCourseName = 'SCORM Course Name';
			//aQuiz - // não tem como nesse caso viz
			sBaseURL 	= getUrlVars()['baseurl'];
			sBaseURLSlides = sBaseURL;
			sBaseURLMedia = sBaseURL;

			doInitCourse();

		}

	}
}

function doInitCourse() {

	// aplica nome do curso
	try {
		$('.course-title').html(sCourseName);
		document.title = sCourseName;
	} catch(e) {};
	

	// verifica se tem avaliação, se sim, adiciona uma página
	try { hasEvaluation = (aQuiz.questions.length > 0) } catch(e) {};
	if (hasEvaluation) nMaxPage++; 

	isHTTP = (window.location.host !== '');

	if (isHTTP) { // está em HTTP
		doPreloadContent(1, doInitUI);	
	} else {
		doInitUI();
	}
	
	//doInitUI();
}

function doGetCourseData(_cid, _callback) {
	$.ajax('https://us-central1-scormhero.cloudfunctions.net/getCourse?cid='+_cid)
		.done(function(_response) {
			//console.log('success', _response);
			console.log('[doGetCourseData] success');
			_callback(_response);
		})
		.fail(function(_error) {
			console.log('[doGetCourseData] error', _error );
		});

}

var imgSlide = new Array();
function doPreloadContent(_page, _callback) {
	var _img;

	var _percent = Math.round((_page/nMaxPage)*100);
	$('.progress-bar').width(_percent+'%');

	imgSlide.push(new Image());

	imgSlide[imgSlide.length-1].load(doGetImageFullURL(_page), function() {
		if ((_page+1) <= nMaxPage) {
			doPreloadContent(_page+1, _callback);
		} else {
			if (_callback) _callback();
		}
	});
}

function doInitUI() {
	$('#spinner-group').hide();
	$('.progress').hide();

	$('#btn-prev').show();
	$('#btn-next').show();

	$('#btn-prev').click(doPrev);
	$('#btn-next').click(doNext);

	try {
		doCheckBookmark();
	} catch(e) {
		doLoadPage(1);
		onPageLoaded();
	}
	
}

function doNext() {
	if (nCurPage < nMaxPage) nCurPage++;

	// verifica ultima página
	if (nCurPage === nMaxPage && hasEvaluation) {
		initEval();
	} else {
		$('#evaluation').hide();
		$('#img-slide').show();
		doLoadPage(nCurPage);
	}
	onPageLoaded();
}

function doPrev() {
	if (nCurPage > 1) nCurPage--;
	
	// verifica ultima página
	if (nCurPage === nMaxPage && hasEvaluation) {
		initEval();
	} else {
		$('#evaluation').hide();
		$('#img-slide').show();
		doLoadPage(nCurPage);
	}
	onPageLoaded();
}

function doGetImageFullURL(_page) {
	return sBaseURLSlides + 'slide'+_page+'.jpg';
}

function doLoadPage(_page) {
	$('#img-slide').on('load', function() {
		// wait image load do get the real size, and resize do fit window (both)
		doOnResize();
	});
	
	if (isHTTP) {
		$('#img-slide').attr('src', imgSlide[_page-1].src);
	} else {
		$('#img-slide').attr('src', doGetImageFullURL(_page));
	}

	try {
		if (aMedia && Array.isArray(aMedia)) {
			var _mediaSrc;
			for (var i = 0; i < aMedia.length && !_mediaSrc; i++) {
				if (aMedia[i].slide === _page) _mediaSrc = sBaseURLMedia + aMedia[i].filename;
			}
			if (_mediaSrc) {
				loadAudio(_mediaSrc);
			} else {
				hideAudio();
				unloadAudio();
			}
		} else {
			hideAudio();
			unloadAudio();
		}
	} catch(e) {};
}

function updatePageCounter() {
	$('#span-page-counter').html(nCurPage + '/' + nMaxPage);
	$('#span-page-counter').show();

	// update 
	(nCurPage == 1) ? $('#btn-prev').attr('disabled', 'disabled'): $('#btn-prev').removeAttr('disabled');
	(nCurPage == nMaxPage) ? $('#btn-next').attr('disabled', 'disabled'): $('#btn-next').removeAttr('disabled');
}

function doSaveBookmark() {

	// do not save bookmark on last page if has evaluation
	// reason: because do not trigger the funcion that starts the final quiz when return to the last page
	if (nCurPage === nMaxPage && hasEvaluation) return;

	try {
		parent.doLMSSetValue('cmi.core.lesson_location', nCurPage);
		parent.doLMSCommit();
	} catch(e) {};
}

function doCheckBookmark() {
	var _bookmark = parent.doLMSGetValue('cmi.core.lesson_location');
	console.log('[doCheckBookmark]', _bookmark);
	if (!isNaN(parseInt(_bookmark, 10))) {
		if (confirm('Would you like to return to the previous visited page?')) {
			nCurPage = _bookmark;
			doLoadPage(nCurPage);
		} else {
			doLoadPage(1);
		}
	} else {
		doLoadPage(1);
	}
	onPageLoaded();
}

function doSetSCOCompleted(_score) {
	try {
	//if (confirm('You have reached the end of this course. Would you like to set this course as completed?')) {
		
		if (_score) {
			parent.doLMSSetValue('cmi.core.score.raw', _score);
			parent.doLMSSetValue('cmi.core.score.min', 0);
			parent.doLMSSetValue('cmi.core.score.max', 100);
		}

		parent.doLMSSetValue('cmi.core.lesson_status', 'completed');
		parent.doLMSCommit();
	//}
	} catch(e) {};

	$(".alert").addClass('show');
	setTimeout(function() {
		$(".alert").alert('close');
	}, 3000);
}

function onPageLoaded() {
	updatePageCounter();
	doSaveBookmark();
	if (nCurPage == nMaxPage && !hasEvaluation) doSetSCOCompleted();
	
}

// Read a page's GET URL variables and return them as an associative array.
function getUrlVars()
{
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i = 0; i < hashes.length; i++)
	{
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

function loadAudio(_src) {
	document.getElementById("audio").pause();
	document.getElementById("audio").setAttribute('src', _src);
	document.getElementById("audio").load();
	document.getElementById("audio").play();
}

function unloadAudio() {
	document.getElementById("audio").pause();
	document.getElementById("audio").setAttribute('src', '');
}

function onAudioLoaded() { showAudio(); }

function hideAudio() {
	$('#audio').hide();
}

function showAudio() {
	$('#audio').show();
}