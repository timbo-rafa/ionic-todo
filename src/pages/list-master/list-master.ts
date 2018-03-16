import { Component } from '@angular/core';
import { IonicPage, ModalController, NavController } from 'ionic-angular';
import {ChangeDetectorRef} from '@angular/core';

import { Item } from '../../models/item';
import { Items } from '../../providers/providers';
import { Todo } from '../../models/todo'
import { TodoProvider } from '../../providers/providers'

@IonicPage()
@Component({
  selector: 'page-list-master',
  templateUrl: 'list-master.html'
})
export class ListMasterPage {
  currentTodos: Todo[];
  clickedItem?: Todo;

  constructor(public navCtrl: NavController, public todos: TodoProvider, public modalCtrl: ModalController, private cd: ChangeDetectorRef) {
    this.currentTodos = this.todos.query();
    this.clickedItem = null;
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() {
    this.currentTodos = []
    this.todos.setup().subscribe(
      todos => {
        console.log('Loaded todos:', todos)
        this.currentTodos = todos
      },
      err => {
        console.log('Unable to load from file:', err)
      }
    )
  }

  /**
   * Prompt the user to add a new item. This shows our ItemCreatePage in a
   * modal and then adds the new item to our data source if the user created one.
   */
  addItem() {
    let addModal = this.modalCtrl.create('ItemCreatePage');
    addModal.onDidDismiss(item => {
      if (item) {
        this.todos.add(item).subscribe(
          success => {
            console.log('observable.addItem returned ', success)
            if (success) {
              this.currentTodos.push(item)
            }
          }
        )
      }
    })
    addModal.present();
  }

  /**
   * Delete an item from the list of items.
   */
  deleteItem(item: Todo) {
    this.todos.delete(item).subscribe(
      success => {
        if (success) {
          this.removeElementFromArray(item)
        }
      }
    )
  }

  removeElementFromArray(item: Todo) {
    var index = this.currentTodos.indexOf(item)
    this.currentTodos.splice(index, 1)
  }

  /**
   * Navigate to the detail page for this item.
   */
  openItem(item: Todo) {
    this.clickedItem = item
    console.log('Clicked on ' + item.title)
    /*
    this.navCtrl.push('ItemDetailPage', {
      item: item
    });
    */
  }
}
