import { HttpClient } from '@angular/common/http';
import { Injectable, EventEmitter, Output } from '@angular/core';
import * as Rx from 'rxjs/Rx'

import { Todo } from '../../models/todo';

import { File, Entry } from '@ionic-native/file'
import { AndroidPermissions } from '@ionic-native/android-permissions';
import { Platform } from 'ionic-angular';


@Injectable()
export class TodoProvider {
  dirname: string = 'todoapp'
  files: Entry[]
  dataDirectory: string

  constructor(public http: HttpClient, private file: File, private androidPermissions: AndroidPermissions, private platform: Platform) {
    console.log('Hello TodoProvider Provider');
    this.dataDirectory = this.file.dataDirectory
    this.android() 
  }

  android() {
    if (this.platform.is('android')) {
      this.dataDirectory = this.file.externalDataDirectory

      this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE).then(
        result => console.log('Has permission?',result.hasPermission),
        err => this.androidPermissions.requestPermissions(
          [this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE,
          this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
          this.androidPermissions.PERMISSION.WRITE_INTERNAL_STORAGE,
          this.androidPermissions.PERMISSION.READ_INTERNAL_STORAGE])
      );
      
      this.androidPermissions.requestPermissions(
        [this.androidPermissions.PERMISSION.WRITE_EXTERNAL_STORAGE,
        this.androidPermissions.PERMISSION.READ_EXTERNAL_STORAGE,
        this.androidPermissions.PERMISSION.WRITE_INTERNAL_STORAGE,
        this.androidPermissions.PERMISSION.READ_INTERNAL_STORAGE]);
    }
  }

  setup(): Rx.Observable<Todo[]> {
    //this.file.externalDataDirectory = 'file:///opt/tmp'
    //console.log('test', this.file)
    console.log('testDir', this.dataDirectory)
    this.files = []
    //this.todos = []

    return Rx.Observable.fromPromise(this.file.createDir(this.dataDirectory, this.dirname, false).then(
      directoryEntry => {
        console.log('created Dir ' + directoryEntry.fullPath)
        return this.fetchFiles()
      },
      err => {
        if (err.code == 12) {
          console.log('dir', this.dirname, 'already exists. Skipping creation.')
          return this.fetchFiles()
        } else {
          console.log('createDir failed.', err)
        }
      }
    )).flatMap(todo => todo)
  }

  fetchFiles(): Rx.Observable<Todo[]> {
    var list: Todo[] =  []
    return Rx.Observable.create(observer => {
      this.file.listDir(this.dataDirectory, this.dirname).then(
        files => {
          console.log('listDir', files)
          this.files = files
          files.forEach( (file) => {
            console.log('>> on file', file)
            this.convert(file).subscribe(
              todo => {
                list.push(todo)

                if (list.length == files.length) {
                  observer.next(list)
                  observer.complete()
                }
              }
            )
          })
        },
        err => {
          console.log('listDir failed', err)
          observer.error(err)
          observer.complete()
        }
      )
    })
  }

  convert(f: Entry): Rx.Observable<Todo> {

    return Rx.Observable.create(observer => {
      this.file.readAsText(this.getPath(), f.name).then(
        data => {
          var todo: Todo
          todo = JSON.parse(data) as Todo
          //this.todos.push(todo)
          observer.next(todo)
          observer.complete()
          console.log('readAsText', data)
        },
        err => {
          console.log('readAsText failed', err)
          observer.error(err)
          observer.complete()
        }
      )
    })
  }

  query(params?: any): Todo[] {
    return [{
      title: "Mocked Title",
      description: "Mocked Description of a todo item",
      deadline: Date.now().toString()
    }]
    //return this.api.get('/items', params);
  }

  getPath(): string {
    return this.dataDirectory + '/' + this.dirname 
  }

  getFilename(item: Todo): string {
    return item.title + '.todo'
  }

  add(item: Todo): Rx.Observable<boolean> {
    var data: string = JSON.stringify(item)

    return Rx.Observable.create(observer => {
      this.file.writeFile(this.getPath(), this.getFilename(item), data, { replace: true }).then(
        (f:Entry) => {
          this.files.push(f)
          //this.todos.push(item)
          observer.next(true)
          observer.complete()
          console.log('wroteFile', f.name, f)
        },
        err => {
          console.log('writeFile failed.', err)
          observer.next(false)
          observer.complete()
        }
      )
    })
  }

  delete(item: Todo): Rx.Observable<boolean> {
    return Rx.Observable.create(observer => {
      this.file.removeFile(this.getPath(), this.getFilename(item)).then(
        value => {
          console.log('removedFile', value)
          observer.next(true)
          observer.complete()
        },
        err => {
          console.log('removeFile failed.', err)
          observer.next(false)
          observer.complete()
        }
      )
    })
  }


  checkDir() {
    this.file.checkDir(this.dataDirectory, this.dirname).then(
      r => {
        this.fetchFiles()
        console.log('Directory exists', r)
      },
      err => {

        console.log('Check dir failed.', err)
      }
    ).catch(
      err => {
        
        console.log('Directory doesnt exist')
      }
    );
  }
}
