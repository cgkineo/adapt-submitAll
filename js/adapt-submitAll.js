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
		 * Returns a reference to the `<div>` we're going to append our view to.
		 * @param {jQuery} $article JQuery reference to the article we're attached to
		 * @param {string} [blockId] The id of the block to append our view to. Must be in the article we're attached to...
		 * @return {jQuery}
		 */
		getContainerDiv: function($article, blockId) {
			if (blockId) {
				var $div = $article.find('.' + blockId);
				if ($div.length > 0) return $div;
			}

			return $article.find('.block').last();
		},

		enableSubmitAllButton: function(enable) {
			var $submitAllButton = this.$el.find('.buttons-action');
			if (enable) {
				$submitAllButton.removeClass('disabled').attr('disabled', false);
				return;
			}

			$submitAllButton.addClass('disabled').attr('disabled', true);
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
				if (view.model.get('_component') === 'textinput') {
					view.$el.find('input').off('input.submitAll change.submitAll');
					return;
				}
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
			if (!view.$el.hasClass('question-component')) return;

			var parentArticleId = view.model.findAncestor('articles').get('_id');
			var submitAllArticleId = this.model.get('_articleView').model.get('_id');
			if (parentArticleId === submitAllArticleId) {
				this.model.get('_componentViews').push(view);
				if (view.model.get('_component') === 'textinput') {
					view.$el.find('input').on('input.submitAll change.submitAll', this.onInteraction);
					return;
				}
				view.$el.on('click.submitAll', this.onInteraction);
			}
		},

		onInteraction: function() {
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