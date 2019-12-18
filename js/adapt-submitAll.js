define([
	'core/js/adapt'
], function(Adapt) {

	var SubmitAll = Backbone.View.extend({

		events: {
			'click .buttons-action': 'onSubmitAllButtonClicked'
		},

		initialize: function() {
			this.model.get('_articleView').$el.addClass('noSubmitButtons');

			this.listenTo(Adapt, {
				'componentView:postRender': this.onComponentViewRendered,
				remove: function() {
					this.removeEventListeners();
					this.remove();
				}
			});

			_.bindAll(this, 'onInteraction', '_onInteractionDelegate');

			this.render();
		},

		render: function() {
			var submitButtonLabels = Adapt.course.get('_buttons')._submit;

			this.$el.html(Handlebars.templates.submitAll({
				buttonText: submitButtonLabels.buttonText,
				ariaLabel: submitButtonLabels.ariaLabel
			}));

			this.$el.addClass('submitAll');

			var $containerDiv = this.getContainerDiv(this.model.get('_articleView').$el, this.model.get('_insertAfterBlock'));
			$containerDiv.after(this.$el);

			return this;
		},

		/**
		 * if _insertAfterBlock is set, looks for and returns that block within the article. If it's not (or wasn't found) returns the last block in the article
		 */
		getContainerDiv: function($articleEl, blockId) {
			var $div;

			if (blockId) {
				$div = $articleEl.find('.' + blockId);
			}

			if (!blockId || $div.length === 0) {
				$div = $articleEl.find('.block').last();
			}

			return $div;
		},

		enableSubmitAllButton: function(enable) {
			var submitAllButton = this.$el.find('.buttons-action');
			if (enable) {
				submitAllButton.removeClass('disabled').attr('disabled', false);
				return;
			}

			submitAllButton.addClass('disabled').attr('disabled', true);
		},

		/**
		 * Checks all the questions in the article to see if they're all ready to be submitted or not
		 * @return {boolean}
		 */
		canSubmit: function() {
			return this.model.get('_componentViews').every(function(component) {
				if (component.model.get('_isEnabled') && component.canSubmit()) {
					return true;
				}
			});
		},

		removeEventListeners: function() {
			this.model.get('_componentViews').forEach(function(view) {
				view.$el.off('click.submitAll');
			});
		},

		/**
		 * Checks the view to see if it is:
		 * a) a question component
		 * b) a child of the article we're attached to
		 * And, if it is, add it to the list and listen out for the learner interacting with it
		 * @param {Backbone.View} view
		*/
		onComponentViewRendered: function(view) {
			var isQuestion = view.$el.hasClass('question-component');
			var parentArticleModel = view.model.findAncestor('articles');
			var isChild = (parentArticleModel === this.model.get('_articleView').model);

			if (isQuestion && isChild) {
				this.model.get('_componentViews').push(view);
				view.$el.on('click.submitAll', this.onInteraction);
				//TODO add support for textInput (see #4)
			}
		},

		onInteraction: function(event) {
			// need to wait until current call stack's done in FF
			_.defer(this._onInteractionDelegate);
		},

		_onInteractionDelegate: function() {
			if (!!this.model.get('_isSubmitted')) return;
			this.enableSubmitAllButton(this.canSubmit());
		},

		onSubmitAllButtonClicked: function() {
			this.model.get('_componentViews').forEach(function(view) {
				$('.buttons-action', view.$el).trigger('click');
			});

			this.enableSubmitAllButton(false);

			this.model.set('_isSubmitted', true);

			Adapt.trigger('submitAll:submitted', this.model.get('_componentViews'));
		}
	});

	Adapt.on('articleView:postRender', function(view) {
		var saData = view.model.get('_submitAll');
		if(saData && saData._isEnabled) {
			var model = new Backbone.Model(saData);
			model.set({
				_articleView: view,
				_componentViews: []
			});
			new SubmitAll({ model: model });
		}
	});
});