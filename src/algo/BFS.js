// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY <COPYRIGHT HOLDER> ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco

import {
	addControlToAlgorithmBar,
	addDivisorToAlgorithmBar,
	addLabelToAlgorithmBar,
} from './Algorithm.js';
import { BFS_DFS_ADJ_LIST } from './util/GraphValues';
import Graph from './Graph.js';
import { act } from '../anim/AnimationMain';
import pseudocodeText from '../pseudocode.json';

const BFS_QUEUE_HEAD_COLOR = '#0000FF';
const VISITED_COLOR = '#99CCFF';

const INFO_MSG_X = 25;
const INFO_MSG_Y = 15;

const LIST_START_X = 30;
const LIST_START_Y = 65;
const LIST_SPACING = 20;

const VISITED_START_X = 30;
const VISITED_START_Y = 115;

const CURRENT_VERTEX_LABEL_X = 25;
const CURRENT_VERTEX_LABEL_Y = 140;
const CURRENT_VERTEX_X = 115;
const CURRENT_VERTEX_Y = 146;

const QUEUE_START_X = 30;
const QUEUE_START_Y = 190;
const QUEUE_SPACING = 20;

const CODE_START_X = 25;
const CODE_START_Y = 250;

export default class BFS extends Graph {
	constructor(am, w, h) {
		super(am, w, h, BFS_DFS_ADJ_LIST);
		this.addControls();
	}

	addControls() {
		addLabelToAlgorithmBar('Start vertex: ');
		this.startField = addControlToAlgorithmBar('Text', '');
		this.startField.style.textAlign = 'center';
		this.startField.onkeydown = this.returnSubmit(
			this.startField,
			this.startCallback.bind(this),
			1,
			false,
		);
		this.startField.size = 2;
		this.controls.push(this.startField);

		this.startButton = addControlToAlgorithmBar('Button', 'Run');
		this.startButton.onclick = this.startCallback.bind(this);
		this.controls.push(this.startButton);

		addDivisorToAlgorithmBar();

		// this.startButton1 = addControlToAlgorithmBar('Button', 'Create Graph');
		// this.startButton1.onclick = this.openCreateGraphModal.bind(this);
		// this.controls.push(this.startButton1);

		super.addControls();
	}

	setup(adjMatrix) {
		super.setup(adjMatrix);
		this.commands = [];
		this.messageID = [];

		this.visited = [];

		this.queueID = [];
		this.listID = [];
		this.visitedID = [];

		this.infoLabelID = this.nextIndex++;
		this.cmd(act.createLabel, this.infoLabelID, '', INFO_MSG_X, INFO_MSG_Y, 0);

		this.pseudocode = pseudocodeText.BFS;

		this.cmd(
			act.createLabel,
			this.nextIndex++,
			'Visited Set:',
			VISITED_START_X - 5,
			VISITED_START_Y - 25,
			0,
		);
		this.cmd(
			act.createLabel,
			this.nextIndex++,
			'List:',
			LIST_START_X - 5,
			LIST_START_Y - 25,
			0,
		);
		this.cmd(
			act.createLabel,
			this.nextIndex++,
			'Current vertex:',
			CURRENT_VERTEX_LABEL_X,
			CURRENT_VERTEX_LABEL_Y,
			0,
		);
		this.cmd(
			act.createLabel,
			this.nextIndex++,
			'Queue:',
			QUEUE_START_X - 5,
			QUEUE_START_Y - 25,
			0,
		);

		this.codeID = this.addCodeToCanvasBaseAll(
			this.pseudocode,
			'run',
			CODE_START_X,
			CODE_START_Y,
		);

		this.animationManager.setAllLayers([0, 32, this.currentLayer]);
		this.animationManager.startNewAnimation(this.commands);
		this.animationManager.skipForward();
		this.animationManager.clearHistory();
		this.lastIndex = this.nextIndex;
	}

	reset() {
		this.nextIndex = this.lastIndex;
		this.listID = [];
		this.messageID = [];
		this.visitedID = [];
	}

	startCallback() {
		if (this.startField.value !== '') {
			let startValue = this.startField.value;
			this.startField.value = '';
			startValue = startValue.toUpperCase();
			this.implementAction(this.doBFS.bind(this), startValue);
		} else {
			this.shake(this.startButton);
		}
	}

	doBFS(startValue) {
		this.commands = [];
		let vertex = startValue.charCodeAt(0) - 65;

		// User input validation
		if (vertex < 0 || vertex >= this.size) {
			this.shake(this.startButton);
			this.cmd(act.setText, this.infoLabelID, startValue + ' is not a vertex in the graph');
			return this.commands;
		}

		this.clear();

		this.queue = [];
		this.queueID = [];
		this.listID = [];
		this.visitedID = [];

		this.rebuildEdges();

		this.cmd(
			act.setText,
			this.infoLabelID,
			'Enqueueing ' + this.toStr(vertex) + ' and adding to visited set',
		);
		this.visited[vertex] = true;
		this.visitedID.push(this.nextIndex);
		this.cmd(
			act.createLabel,
			this.nextIndex++,
			this.toStr(vertex),
			VISITED_START_X,
			VISITED_START_Y,
		);
		this.cmd(act.setBackgroundColor, this.circleID[vertex], VISITED_COLOR);
		this.queue.push(vertex);
		this.queueID.push(this.nextIndex);
		this.cmd(
			act.createLabel,
			this.nextIndex++,
			this.toStr(vertex),
			QUEUE_START_X,
			QUEUE_START_Y,
		);
		this.highlight(1, 0, this.codeID);
		this.highlight(2, 0, this.codeID);
		this.highlight(3, 0, this.codeID);
		this.highlight(4, 0, this.codeID);
		this.highlight(5, 0, this.codeID);
		this.cmd(act.step);
		this.unhighlight(1, 0, this.codeID);
		this.unhighlight(2, 0, this.codeID);
		this.unhighlight(3, 0, this.codeID);
		this.unhighlight(4, 0, this.codeID);
		this.unhighlight(5, 0, this.codeID);
		while (this.queue.length > 0 && this.listID.length < this.size) {
			vertex = this.queue.shift();
			this.highlight(6, 0, this.codeID);
			this.highlight(7, 0, this.codeID);
			this.cmd(
				act.setText,
				this.infoLabelID,
				'Dequeueing ' + this.toStr(vertex) + ' and adding to list',
			);

			this.cmd(act.setTextColor, this.queueID[0], BFS_QUEUE_HEAD_COLOR);
			this.cmd(act.move, this.queueID[0], CURRENT_VERTEX_X, CURRENT_VERTEX_Y);
			for (let i = 1; i < this.queueID.length; i++) {
				this.cmd(
					act.move,
					this.queueID[i],
					QUEUE_START_X + (i - 1) * QUEUE_SPACING,
					QUEUE_START_Y,
				);
			}

			this.listID.push(this.nextIndex);
			this.cmd(
				act.createLabel,
				this.nextIndex++,
				this.toStr(vertex),
				LIST_START_X + (this.listID.length - 1) * LIST_SPACING,
				LIST_START_Y,
			);

			this.visitVertex(vertex);
			this.cmd(act.step);
			this.unhighlight(7, 0, this.codeID);
			this.highlight(8, 0, this.codeID);
			this.cmd(act.step);
			this.unhighlight(8, 0, this.codeID);

			for (let neighbor = 0; neighbor < this.size; neighbor++) {
				if (this.adj_matrix[vertex][neighbor] > 0) {
					this.highlightEdge(vertex, neighbor, 1);
					this.highlight(9, 0, this.codeID);
					this.cmd(act.step);
					this.highlight(10, 0, this.codeID);
					this.cmd(act.step);
					if (!this.visited[neighbor]) {
						this.unhighlight(10, 0, this.codeID);
						this.highlight(11, 0, this.codeID);
						this.highlight(12, 0, this.codeID);
						this.visited[neighbor] = true;
						this.visitedID.push(this.nextIndex);
						this.cmd(
							act.setText,
							this.infoLabelID,
							this.toStr(neighbor) +
								' has not yet been visited, enqueueing and adding to visited set',
						);
						this.cmd(
							act.createLabel,
							this.nextIndex++,
							this.toStr(neighbor),
							VISITED_START_X + (this.visitedID.length - 1) * LIST_SPACING,
							VISITED_START_Y,
						);
						this.cmd(act.setBackgroundColor, this.circleID[neighbor], VISITED_COLOR);
						this.queue.push(neighbor);
						this.queueID.push(this.nextIndex);
						this.cmd(
							act.createLabel,
							this.nextIndex++,
							this.toStr(neighbor),
							QUEUE_START_X + (this.queue.length - 1) * QUEUE_SPACING,
							QUEUE_START_Y,
						);
					} else {
						this.cmd(
							act.setText,
							this.infoLabelID,
							this.toStr(neighbor) + ' has already been visited, skipping',
						);
					}
					this.unhighlight(10, 0, this.codeID);
					this.cmd(act.step);
					this.unhighlight(11, 0, this.codeID);
					this.unhighlight(12, 0, this.codeID);
					this.highlightEdge(vertex, neighbor, 0);
				}
				this.unhighlight(9, 0, this.codeID);
			}
			this.unhighlight(8, 0, this.codeID);

			this.cmd(act.delete, this.queueID.shift());

			this.leaveVertex();
		}
		this.unhighlight(6, 0, this.codeID);

		if (this.queue.length > 0) {
			this.cmd(act.setText, this.infoLabelID, 'All vertices have been visited, done');
		} else {
			this.cmd(act.setText, this.infoLabelID, 'Queue is empty, done');
		}

		return this.commands;
	}

	clear() {
		for (let i = 0; i < this.size; i++) {
			this.cmd(act.setBackgroundColor, this.circleID[i], '#FFFFFF');
			this.visited[i] = false;
		}
		for (let i = 0; i < this.listID.length; i++) {
			this.cmd(act.delete, this.listID[i]);
		}
		for (let i = 0; i < this.visitedID.length; i++) {
			this.cmd(act.delete, this.visitedID[i]);
		}
		if (this.messageID != null) {
			for (let i = 0; i < this.messageID.length; i++) {
				this.cmd(act.delete, this.messageID[i]);
			}
		}
		this.messageID = [];
	}

	// Add this new method in the class
	/*openCreateGraphModal() {
		// Create modal container
		const modal = document.createElement('div');
		modal.style.position = 'fixed';
		modal.style.top = '50%';
		modal.style.left = '50%';
		modal.style.transform = 'translate(-50%, -50%)';
		modal.style.zIndex = '1000';
		modal.style.width = '80%';
		modal.style.height = '80%';
		modal.style.backgroundColor = '#fff';
		modal.style.boxShadow = '0px 4px 6px rgba(0, 0, 0, 0.1)';
		modal.style.padding = '20px';
		modal.style.overflow = 'hidden';
	
		// Create iframe for the webpage
		const iframe = document.createElement('iframe');
		iframe.src = '../CreateGraph'; // Path to CreateGraph page
		iframe.style.width = '100%';
		iframe.style.height = '90%';
		iframe.style.border = 'none';

		// Add iframe to modal
		modal.appendChild(iframe);

		// Create a close button
		const closeButton = document.createElement('button');
		closeButton.innerText = 'Close';
		closeButton.style.position = 'absolute';
		closeButton.style.top = '10px';
		closeButton.style.right = '10px';
		closeButton.style.backgroundColor = '#f44336';
		closeButton.style.color = '#fff';
		closeButton.style.border = 'none';
		closeButton.style.padding = '10px';
		closeButton.style.cursor = 'pointer';
		closeButton.onclick = () => {
			document.body.removeChild(modal);
		};
	
		// Add close button to modal
		modal.appendChild(closeButton);

		// Append modal to the document body
		document.body.appendChild(modal);

		document.addEventListener('DOMContentLoaded', () => {
			if (iframe) {
				iframe.addEventListener('load', () => {
					try {
						const iframeDocument = iframe.contentWindow.document;
						const runButton = iframeDocument.querySelector('input[type="Button"][value="Run"]');
						if (runButton) {
							runButton.addEventListener('click', (event) => {
								event.preventDefault(); // Prevent default behavior (if any)
								//const modal = document.querySelector('#modal'); // Replace with your modal's selector
								if (modal) {
									modal.style.display = 'none'; // Hide the modal
								}
								console.log('Run button clicked. Modal closed.');
							});
						} else {
							console.warn('Run button not found in iframe.');
						}
					} catch (error) {
						console.error('Error accessing iframe content:', error);
					}
				});
			} else {
				console.error('Iframe not found.');
			}
		});
	}*/
}
