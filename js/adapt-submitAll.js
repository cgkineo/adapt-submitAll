define([
	'core/js/adapt'
], function(Adapt) {

	var SubmitAll = Backbone.View.extend({

		initialize: function() {
			this.model.get("_articleView").$el.addClass("noSubmitButtons");

			this.listenTo(Adapt, 'remove', this.remove);
			this.listenTo(Adapt,'componentView:postRender', this.onComponentViewRendered);

			_.bindAll(this, "onInteraction", "_onInteractionDelegate", "onSubmitClicked");

			this.render();
		},

		render: function() {
			var buttonLabel = Adapt.course.get("_buttons")._submit.buttonText;
			var template = Handlebars.templates.submitAll;

			this.$el.html(template({ submit: (buttonLabel) ? buttonLabel : "unset_submit_button" }));
			
			this.$el.addClass("submitAll");

			var $containerDiv = this.getContainerDiv(this.model.get("_articleView").$el, this.model.get("_insertAfterBlock"));
			$containerDiv.after(this.$el);

			return this;
		},

		/**
		 * if _insertAfterBlock is set, looks for and returns that block within the article. If it's not (or wasn't found) returns the last block in the article
		 */
		getContainerDiv: function($articleEl, blockId) {
			var $div;

			if(blockId) {
				$div = $articleEl.find("." + blockId);
			}

			if(!blockId || $div.length === 0) {
				$div = $articleEl.find(".block").last();
			}

			return $div;
		},

		enableButtons: function(enable) {
			var buttons = this.model.get("_articleView").$el.find(".buttons-action");
			if(enable) {
				buttons.removeClass("disabled").attr('disabled', false).attr('aria-label', Adapt.course.get('_buttons')._submit.ariaLabel);
				$(".buttons-action", this.$el).on("click.submitAll", this.onSubmitClicked);
			} else {
				buttons.addClass("disabled").attr('disabled', true);
				this.$el.find(".buttons-action").off("click.submitAll", this.onSubmitClicked);
			}
		},

		canSubmit: function() {
			var isSubmittable = true;
			_.each(this.model.get("_componentViews"), function(component) {
				if(!component.model.get("_isEnabled") || component.canSubmit() === false) {
					isSubmittable = false;
				}
			});
			return isSubmittable;
		},

		/**
		* Event handling
		*/
		onComponentViewRendered: function(view) {
			var isQuestion = view.canSubmit; // ASSUMPTION
			var parentArticleModel = view.model.findAncestor("articles");
			var isChild = parentArticleModel === this.model.get("_articleView").model;

			if(isQuestion && isChild) {
				this.model.get("_componentViews").push(view);
				view.$el.on("click inview", this.onInteraction);
			}
		},

		onInteraction: function(event) {
			// need to wait until current call stack's done in FF
			_.defer(this._onInteractionDelegate);
		},

		_onInteractionDelegate: function() {
			var buttons = this.model.get("_articleView").$el.find(".buttons-action");
			if (!!this.model.get("_isSubmitted")) return;
			this.enableButtons(this.canSubmit());
		},

		onSubmitClicked: function() {
			var buttons = this.model.get("_articleView").$el.find(".buttons-action");

			if(buttons.hasClass("disabled")) return;

			_.each(this.model.get("_componentViews"), function(view) {
				view.$el.off("click inview", this.onInteraction);
				$(".buttons-action", view.$el).trigger("click");
			}, this);

			this.enableButtons(false);

			this.model.set("_isSubmitted", true);

			Adapt.trigger("submitAll:submitted", this.model.get("_componentViews"));
		}
	});

	Adapt.on("articleView:postRender", function(view) {
		var saData = view.model.get("_submitAll");
		if(saData && saData._isEnabled === true) {
			var model = new Backbone.Model(saData);
			model.set({
				"_articleView": view,
				"_componentViews": []
			});
			new SubmitAll({ model: model });
		}
	});
});