var UI = require('ui');
var ajax = require('ajax');
var Settings = require('settings');

Settings.config(
  {url: 'http://stephen-mitchell.github.io/PebbleHub/configurable_v0_1.html'},
  function(e)
  {
    console.log('opening configurable');
  },
  function(e)
  {
    console.log('closed configurable');
    console.log('Got settings: ' + JSON.stringify(e.options));
  }
);

function build_menu_item(event)
{
  // Generate summary data to populate the events menu, where event is a JSON object representing a GitHub event
  // (see the GitHub API docs at https://developer.github.com/v3/activity/events/)
  // Returns an object with the properties title and subtitle
  switch (event.type)
    {
      case "CommitCommentEvent":
        return {title:"Commit Comment",
                subtitle:"on commit " + event.payload.comment.commit_id.substr(0, 7)};
      case "CreateEvent":
        if (event.payload.ref_type === 'repository')
          {
            return {title:"New repo",
                    subtitle:event.repo.name};
          }
          return {title:"New " + event.payload.ref_type,
                  subtitle:event.payload.ref};
      case "DeleteEvent":
        return {title:"Deleted " + event.payload.ref_type,
                subtitle:event.payload.ref};
      case "ForkEvent":
        return {title:"Repo forked",
                subtitle:event.repo.name};
      case "GollumEvent":
        return {title:"Wiki updated",
                subtitle:event.payload.pages.length + " pages changed"};
      case "IssueCommentEvent":
        return {title:"Comment",
                subtitle:"on issue #" + event.payload.issue.number};
      case "IssuesEvent":
        return {title:event.payload.action.charAt(0).toUpperCase() + event.payload.action.substring(1),
                subtitle:"Issue #" + event.payload.issue.number};
      case "MemberEvent":
        return {title:"User added",
                subtitle:event.payload.member.login};
      case "PublicEvent":
        return {title:"Repo published",
                subtitle:event.repo.name};
      case "PullRequestEvent":
        if (event.payload.action === "closed")
          {
            if (event.payload.pull_request.merged === true)
              {
                return {title:"Merged",
                        subtitle:"Pull Req. #" + event.payload.number};
              }
            else
              {
                return {title:"Closed",
                        subtitle:"Pull Req. #" + event.payload.number};
              }
          }
        return {title:event.payload.action.charAt(0).toUpperCase() + event.payload.action.substring(1),
                subtitle:"Pull Req. #" + event.payload.number};
      case "PullRequestReviewCommentEvent":
        return {title:"Comment",
                subtitle:"on pull req. #" + event.payload.pull_request.number};
      case "PushEvent":
        return {title:event.payload.size + " commit(s)",
                subtitle:"to " + event.payload.ref};
      case "ReleaseEvent":
        return {title:"Released",
                subtitle:event.payload.release.tag_name};
      case "WatchEvent":
        return {title:"Starred repo",
                subtitle:event.repo.name};
      default:
        return {title:event.type,
                subtitle:"Unsupported event type"};
    }
}

function prepare_event_details(event)
{
  // Generate data to populate an event details card, where event is a JSON object representing a GitHub event
  // (see the GitHub API docs at https://developer.github.com/v3/activity/events/)
  // Returns an object with the properties title and body
  switch (event.type)
    {
      case "CommitCommentEvent":
        var body = event.actor.login + " commented on " + event.repo.name + 
            " commit " + event.payload.comment.commit_id.substr(0, 7);
        if (event.payload.comment.path !== null)
          {
            body += " " + event.payload.comment.path;
            if (event.payload.comment.line !== null)
              {
                body += " line " + event.payload.comment.line;
              }
          }
        body += "\n" + event.payload.comment.body;
        return {title:"Commit Comment",
                body:body};
      case "CreateEvent":
        if (event.payload.ref_type === 'repository')
          {
            return {title:"New Repository",
                    body:event.actor.login + " created new repository " + event.repo.name};
          }
        return {title:"New " + event.payload.ref_type.charAt(0).toUpperCase() + event.payload.ref_type.substring(1),
                body:event.actor.login + " created new " + event.payload.ref_type + " " + event.payload.ref + 
                " in repository " + event.repo.name};
      case "DeleteEvent":
        return {title:"Deleted " + event.payload.ref_type.charAt(0).toUpperCase() + event.payload.ref_type.substring(1),
                body:event.actor.login + " deleted " + event.payload.ref_type + " " + event.payload.ref +
               " from repository " + event.repo.name};
      case "ForkEvent":
        return {title:"Repository Forked",
                body:event.actor.login + " forked repository " + event.repo.name +
               " to " + event.payload.forkee.full_name};
      case "GollumEvent":
        var body = event.actor.login + " updated pages in the wiki attached to repository " + event.repo.name + ":";
        for (var i = 0; i < event.payload.pages.length; i++)
          {
            body += "\n* " + event.payload.pages[i].title + " (" + event.payload.pages[i].action + ")";
          }
        return {title:"Wiki Updated",
                body:body};
      case "IssueCommentEvent":
        return {title:"Issue Comment",
                body:event.actor.login + " commented on issue #" + event.payload.issue.number + " " +
                event.payload.issue.title + " in repository " + event.repo.name + ":\n" + event.payload.comment.body};
      case "IssuesEvent":
        if (event.payload.action === "opened" || event.payload.action === "closed" || event.payload.action === "reopened")
          {
            return {title:"Issue " + event.payload.action.charAt(0).toUpperCase() + event.payload.action.substring(1),
                    body:event.actor.login + " " + event.payload.action + " issue #" + event.payload.issue.number + ": " +
                    event.payload.issue.title + " in repository " + event.repo.name};
          }
        else if (event.payload.action === "assigned")
          {
            return {title:"Issue Assigned",
                    body:event.actor.login + " assigned issue #" + event.payload.issue.number + ": " + event.payload.issue.title +
                   " in repository " + event.repo.name + " to " + event.payload.assignee.login};
          }
        else if (event.payload.action === "unassigned")
          {
            return {title:"Issue Unssigned",
                    body:event.actor.login + " unassigned issue #" + event.payload.issue.number + ": " + event.payload.issue.title +
                   " in repository " + event.repo.name + " from " + event.payload.assignee.login};
          }
        else if (event.payload.action === "labeled")
          {
            return {title:"Issue Labeled",
                    body:event.actor.login + "added label " + event.payload.label.name + " to issue #" + event.payload.issue.number +
                    ": " + event.payload.issue.title + " in repository " + event.repo.name};
          }
        else // action === unlabelled
          {
            return {title:"Issue Unlabeled",
                    body:event.actor.login + "removed label " + event.payload.label.name + " from issue #" + event.payload.issue.number +
                    ": " + event.payload.issue.title + " in repository " + event.repo.name};
          }
        break;
      case "MemberEvent":
        return {title:"User Added",
                body:event.actor.login + " granted access to " + event.repo.name + " to " + event.payload.member.login};
      case "PublicEvent":
        return {title:"Repository Published",
                body:event.actor.login + " made the repository " + event.repo.name + " public"};
      case "PullRequestEvent":
        if (event.payload.action === "opened" || event.payload.action === "reopened")
          {
            return {title:"Pull Request " + event.payload.action.charAt(0).toUpperCase() + event.payload.action.substring(1),
                    body:event.actor.login + " " + event.payload.action + " pull request #" + event.payload.pull_request.number + ": " +
                    event.payload.pull_request.title + " in repository " + event.repo.name};
          }
        else if (event.payload.action === "assigned")
          {
            return {title:"Pull Request Assigned",
                    body:event.actor.login + " assigned pull request #" + event.payload.pull_request.number +
                    ": " + event.payload.pull_request.title + " in repository " + event.repo.name + " to " +
                    event.payload.assignee.login};
          }
        else if (event.payload.action === "unassigned")
          {
            return {title:"Pull Request Unssigned",
                    body:event.actor.login + " unassigned pull request #" + event.payload.pull_request.number +
                    ": " + event.payload.pull_request.title + " in repository " + event.repo.name + " from " +
                    event.payload.assignee.login};
          }
        else if (event.payload.action === "labeled")
          {
            return {title:"Pull Request Labeled",
                    body:event.actor.login + "added label " + event.payload.label.name + " to pull request #" +
                    event.payload.pull_request.number + ": " + event.payload.pull_request.title + " in repository " +
                    event.repo.name};
          }
        else if (event.payload.action === "unlabelled")
          {
            return {title:"Pull Request Unlabeled",
                    body:event.actor.login + "removed label " + event.payload.label.name + " from pull request #" +
                    event.payload.pull_request.number + ": " + event.payload.pull_request.title + " in repository " +
                    event.repo.name};
          }
        else // event.payload.action === "closed"
          {
            if (event.payload.pull_request.merged === true)
              {
                return {title:"Pull Request Merged",
                        body:event.actor.login + " merged and closed pull request #" + event.payload.pull_request.number +
                        ": " + event.payload.pull_request.title + " in repository " + event.repo.name};
              }
            else
              {
                return {title:"Pull Request Closed",
                       body:event.actor.login + " closed pull request #" + event.payload.pull_request.number +
                        ": " + event.payload.pull_request.title + " in repository " + event.repo.name + " without merging"};
              }
          }
        break;
      case "PullRequestReviewCommentEvent":
        return {title:"Comment on Pull Request",
                body:event.actor.login + " commented on pull request #" + event.payload.pull_request.number + ": " +
                event.payload.pull_request.title + " in repository " + event.repo.name + ":\n" + event.payload.comment.body};
      case "PushEvent":
        var body = event.actor.login + " pushed " + event.payload.size + " commits to " + event.payload.ref +
            " in repository " + event.repo.name;
        for (i = 0; i < event.payload.commits.length; i++)
          {
            body += "\n\n" + event.payload.commits[i].sha.substr(0, 7) + "\n" + event.payload.commits[i].message;
          }
        return {title:event.payload.size + " commit(s)",
                body:body};
      case "ReleaseEvent":
        return {title:"Created Release",
                body:event.actor.login + " created release " + event.payload.release.tag_name + " on repository " + event.repo.name};
      case "WatchEvent":
        return {title:"Starred Repository",
                body:event.actor.login + " starred repository " + event.repo.name};
      default:
        return {title: event.type,
                body: "This message type is not supported"};
    }
}

function run_events_screen(json_events_list)
{
  // Create a Menu containing each event from json_events_list
  var menu_elements = [];
  console.log("Got " + json_events_list.length + " events, building menu elements");
  for (var event_index = 0; event_index < json_events_list.length; event_index++)
    {
      menu_elements.push(build_menu_item(json_events_list[event_index]));
    }
  console.log("Built " + menu_elements.length + " menu elements, creating menu");
  var events_menu = new UI.Menu({sections:[{items:menu_elements}]});
  // Register callback to display event details when the select button is pressed
  events_menu.on('select', function(e) {
    // Create and show a card to display event details
    var event_details = prepare_event_details(json_events_list[e.itemIndex]);
    var eventCard = new UI.Card({
      title: event_details.title,
      body: event_details.body,
      scrollable: true,
      style: "small"
      });
    eventCard.show();
    });
  console.log("Created menu, showing");
  events_menu.show();
}

function display_error(title, error)
{
  // Display an error message, where title is the message title and error is an error object returned by ajax
  var card = new UI.Card({scrollable: true,
                          style: "large",
                          title: title});
  if (error.message === "Bad credentials")
    {
      card.body('Bad Credentials\nPlease check the GitHub API Access Token and restart the app.');
    }
  else
    {
      card.body(error.message);
    }
  card.show();
}

function get_json_data(url)
{
  // Given a URL, either fetch a JSON object or an eror message
  // Returns an object with the properties data and error, one will always be undefined
  var ajaxdata, ajaxerror = undefined;
  console.log("get_json_data: Requesting data from " + url);
  ajax(
    {url:url, type:'json', async:false},
    function(data)
    {
      console.log("get_json_data.ajax.success: Got data " + JSON.stringify(data));
      ajaxdata = data;
    },
    function(error)
    {
      console.log("get_json_data.ajax.error: Got error " + JSON.stringify(error));
      ajaxerror = error;
    }
  );
  var return_value = {data: ajaxdata,
                      error: ajaxerror};
  console.log("get_json_data: Returning data " + JSON.stringify(return_value));
  return return_value; 
}

// Create and show loading screen
var loadingCard = new UI.Card({title:"PebbleHub",
                               subtitle:"Loading..."});
loadingCard.show();

// Read GitHub Access Token from settings
var githubAccessToken = Settings.option("githubAccessToken");
console.log("Read GitHub Access Token " + githubAccessToken);

// If the GitHub access token is undefined, display an error
if (githubAccessToken === undefined)
  {
    var noTokenCard = new UI.Card({title:"No Access Token",
                                   subtitle:"GitHub Access Token could not be read from settings. Please check the app settings on your phone and restart the app.",
                                  });
    loadingCard.hide();
    noTokenCard.show();
  }

// Retrieve the user object for the owner of the access token
var authenticatedUserUrl = 'https://api.github.com/user?access_token=' + githubAccessToken;
var authenticated_user = get_json_data(authenticatedUserUrl);
console.log(JSON.stringify(authenticated_user));

if (authenticated_user.data !== undefined)
  {
    // If user data was retrieved successfully, attempt to retrieve the first page of events
    var events_url = 'https://api.github.com/users/' + authenticated_user.data.login + '/received_events?access_token=' + githubAccessToken;
    //var events_url = 'https://api.github.com/events';
    console.log("Downloading events list from " + events_url);
    var events_list = get_json_data(events_url);
    // Hide the loading screen so that pressing the back button won't display it
    loadingCard.hide();
    if (events_list.data !== undefined)
      {
        // Events list was retrieved successfully. Start building the events screen
        console.log("Retrieved events list");
        run_events_screen(events_list.data);
      }
    else
      {
        // Couldn't get events list. Show error
        display_error('Error retrieving events list', events_list.error);
      }
  }
else
  {
    // Couldn't get user data. Show error
    display_error('Error retrieving authenticated user details', authenticated_user.error);
  }
