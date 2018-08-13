import { FlowRouter } from 'meteor/kadira:flow-router'
import { $ } from 'meteor/jquery'
import JSZip from 'jszip'
import dataTableButtons from 'datatables.net-buttons-bs4'
import html5ExportButtons from 'datatables.net-buttons/js/buttons.html5.js'
import dataTablesBootstrap from '../components/dataTables.bootstrap4.js'
import Projects from '../../api/projects/projects.js'
import periodToDates from '../../utils/periodHelpers.js'
import '../components/dataTables.bootstrap4.scss'
import './timecardlist.html'
import '../components/periodpicker.js'
import '../components/resourceselect.js'
import '../components/tablecell.js'
import '../components/customerselect.js'
import '../../api/timecards/tabular.js'

Template.timecardlist.onCreated(function createTimeCardList() {
  this.period = new ReactiveVar('currentMonth')
  this.resource = new ReactiveVar('all')
  this.project = new ReactiveVar()
  this.customer = new ReactiveVar('all')
  this.autorun(() => {
    this.project.set(FlowRouter.getParam('projectId'))
  })
  // super hacky, but is needed for Excel export button to show
  window.JSZip = JSZip
  dataTablesBootstrap(window, $)
  dataTableButtons(window, $)
  html5ExportButtons(window, $)
  Meteor.setTimeout(() => {
    $('[data-toggle="tooltip"]').tooltip()
  }, 1000)
})

// at least free up the window assignment when this template instance is removed from DOM
Template.timecardlist.onDestroyed(() => {
  delete window.JSZip
})
Template.timecardlist.helpers({
  selector() {
    const returnSelector = {}
    if (Template.instance().project.get() !== 'all') {
      returnSelector.projectId = Template.instance().project.get()
    }
    if (Template.instance().resource.get() !== 'all') {
      returnSelector.userId = Template.instance().resource.get()
    }
    if (Template.instance().customer.get() !== 'all') {
      const projectList = Projects.find(
        {
          customer: Template.instance().customer.get(),
          $or: [{ userId: Meteor.userId() }, { public: true }, { team: Meteor.userId() }],
        },
        { $fields: { _id: 1 } },
      ).fetch().map(value => value._id)
      returnSelector.projectId = { $in: projectList }
    }
    if (Template.instance().period.get() !== 'all') {
      const { startDate, endDate } = periodToDates(Template.instance().period.get())
      returnSelector.date = { $gte: startDate, $lte: endDate }
    }
    return returnSelector
  },
  project() {
    return Template.instance().project
  },
})

Template.timecardlist.events({
  'change #period': (event, templateInstance) => {
    templateInstance.period.set($(event.currentTarget).val())
  },
  'change #resourceselect': (event, templateInstance) => {
    templateInstance.resource.set($(event.currentTarget).val())
  },
  'change #customerselect': (event, templateInstance) => {
    templateInstance.customer.set($(event.currentTarget).val())
  },
})
