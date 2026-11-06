$ErrorActionPreference='Stop'
$workspace='C:\Users\user\Documents\editshop'
$git='C:\Program Files\Git\cmd\git.exe'
$gh='C:\Program Files\GitHub CLI\gh.exe'
$prefix='arcade/bamta/'
function Git([string[]]$arguments){
  $result=& $git -C $workspace @arguments
  if($LASTEXITCODE -ne 0){throw "Git operation failed: $($arguments -join ' ')"}
  return ($result -join "`n").Trim()
}
function Api([string]$endpoint){
  $result=& $gh api $endpoint
  if($LASTEXITCODE -ne 0){throw 'GitHub read failed'}
  return ($result -join "`n")|ConvertFrom-Json
}
$policy=Api 'repos/visualnewsis/visual/contents/AGENTS.md?ref=main'
$known=Git @('rev-parse','origin/main:AGENTS.md')
if($policy.sha -ne $known){throw 'Project instructions changed; review before publication.'}
$names=@('index.html','release.json','game.js','scene.js','actors.js','faces.js','interior.js','props.js','art.js','dialogue.js','dispatch.js','sound.js','design.css','style.css','mission.js','vendor/LICENSE.txt','vendor/three.core.min.js','vendor/three.module.min.js')
Get-ChildItem -LiteralPath (Join-Path $workspace 'arcade/bamta/assets/art-v2') -File | ForEach-Object { $names+='assets/art-v2/'+$_.Name }
Write-Output "Prepared $($names.Count) game files; only the existing BTA game folder will change."
Write-Output 'READY_TO_PUBLISH'
$command=[Console]::ReadLine()
if(-not $command){$command='status'}
if($command -eq 'recover'){
  $runs=Api 'repos/visualnewsis/visual/actions/workflows/deploy.yml/runs?branch=main&per_page=1'
  $run=$runs.workflow_runs[0]
  $main=Api 'repos/visualnewsis/visual/git/ref/heads/main'
  $dispatchLatest=$main.object.sha -ne $run.head_sha
  if($dispatchLatest){$comparison=Api "repos/visualnewsis/visual/compare/$($run.head_sha)...$($main.object.sha)";if($comparison.status -ne 'ahead'){throw 'Main is not a descendant of the stalled deployment; no cancellation attempted.'}}
  $jobs=Api "repos/visualnewsis/visual/actions/runs/$($run.id)/jobs"
  $active=@($jobs.jobs | Where-Object {$_.status -eq 'in_progress'})
  if($active.Count -ne 1 -or $active[0].name -notlike '*Prepare release*'){throw 'Deployment is not stalled in its preparation job; no cancellation attempted.'}
  $steps=@($active[0].steps | Where-Object {$_.status -eq 'in_progress'})
  if($steps.Count -ne 1 -or $steps[0].name -notlike '*download-artifact*'){throw 'Download step is no longer active; no cancellation attempted.'}
  $age=[DateTimeOffset]::UtcNow-([DateTimeOffset]$steps[0].started_at)
  if($age.TotalMinutes -lt 8){throw 'Download has not been stalled long enough to retry.'}
  Write-Output "Retrying only the latest stalled preparation job $($active[0].id), age $([int]$age.TotalMinutes) minutes."
  & $gh run cancel $run.id -R visualnewsis/visual
  if($LASTEXITCODE -ne 0){throw 'Could not cancel the stalled attempt.'}
  for($poll=0;$poll -lt 12;$poll++){
    $state=Api "repos/visualnewsis/visual/actions/runs/$($run.id)"
    if($state.status -eq 'completed'){break}
    Start-Sleep -Seconds 5
  }
  if($state.status -ne 'completed'){throw 'Cancellation is still pending.'}
  $main=Api 'repos/visualnewsis/visual/git/ref/heads/main'
  if($main.object.sha -ne $run.head_sha){& $gh workflow run deploy.yml --ref main -R visualnewsis/visual}
  else{& $gh run rerun $run.id --job $active[0].id -R visualnewsis/visual}
  if($LASTEXITCODE -ne 0){throw 'Could not retry the preparation job.'}
  Write-Output 'PREPARATION_RETRY_STARTED'
  exit 0
}
if($command -eq 'diagnose'){
  $runs=Api 'repos/visualnewsis/visual/actions/workflows/deploy.yml/runs?branch=main&per_page=1'
  $run=$runs.workflow_runs[0]
  Write-Output "LATEST $($run.id) $($run.status) $($run.conclusion) START $($run.run_started_at)"
  $jobs=Api "repos/visualnewsis/visual/actions/runs/$($run.id)/jobs"
  foreach($job in $jobs.jobs){Write-Output "JOB $($job.id) $($job.name) $($job.status)";foreach($step in $job.steps){if($step.status -eq 'in_progress'){Write-Output "STEP $($step.name) START $($step.started_at)"}}}
  $artifacts=Api "repos/visualnewsis/visual/actions/runs/$($run.id)/artifacts"
  foreach($artifact in $artifacts.artifacts){Write-Output "ARTIFACT $($artifact.name) BYTES $($artifact.size_in_bytes) CREATED $($artifact.created_at) EXPIRED $($artifact.expired)"}
  $previous=Api 'repos/visualnewsis/visual/actions/runs/40138074140/jobs'
  foreach($job in $previous.jobs){foreach($step in $job.steps){if($step.name -like '*download-artifact*'){Write-Output "PREVIOUS_DOWNLOAD $($step.started_at) -> $($step.completed_at) $($step.conclusion)"}}}
  foreach($job in $jobs.jobs){if($job.status -eq 'in_progress'){
    $log=& $gh api "repos/visualnewsis/visual/actions/jobs/$($job.id)/logs" 2>$null
    if($LASTEXITCODE -eq 0){$log | Select-Object -Last 12 | ForEach-Object {Write-Output $_}}else{Write-Output 'Live job logs are not available through the API yet.'}
  }}
  exit 0
}
if($command -eq 'status'){
 for($check=0;$check -lt 30;$check++){
  $published=([IO.File]::ReadAllLines((Join-Path $workspace 'output/bamta-redesign-20261024/PUBLISHED.txt')))[0]
  $runs=Api "repos/visualnewsis/visual/actions/runs?head_sha=$published&per_page=30"
  foreach($run in $runs.workflow_runs){Write-Output "$($run.id) $($run.name) $($run.head_sha) $($run.status) $($run.conclusion) $($run.html_url)"}
  $latest=Api 'repos/visualnewsis/visual/actions/workflows/deploy.yml/runs?branch=main&per_page=3'
  foreach($run in $latest.workflow_runs){Write-Output "LATEST_DEPLOY $($run.id) $($run.head_sha) $($run.status) $($run.conclusion)"}
  if($latest.workflow_runs.Count){
    $jobs=Api "repos/visualnewsis/visual/actions/runs/$($latest.workflow_runs[0].id)/jobs"
    foreach($job in $jobs.jobs){Write-Output "JOB $($job.name) $($job.status) $($job.conclusion)";foreach($step in $job.steps){if($step.status -eq 'in_progress'){Write-Output "STEP $($step.name)"}}}
  }
  $response=Invoke-WebRequest -Uri 'https://visual.newsis.com/arcade/bamta/?v=mesh1' -SkipHttpErrorCheck
  Write-Output "PUBLIC_HTTP $([int]$response.StatusCode) MESH_PRESENT $($response.Content -match '20261025-mesh1')"
  if($response.Content -notmatch '20261025-mesh1'){Start-Sleep -Seconds 30;continue}
  $destination=Join-Path $workspace 'output/bamta-redesign-20261024/public-check'
  $null=New-Item -ItemType Directory -Path $destination -Force
  foreach($name in $names){
    $target=Join-Path $destination ($name.Replace('/','_'))
    Invoke-WebRequest -Uri ("https://visual.newsis.com/$prefix"+$name+'?verify='+$published) -OutFile $target
    $source=Join-Path $workspace ('arcade/bamta/'+$name)
    if($name -eq 'release.json'){$source=Join-Path $workspace 'output/bamta-redesign-20261024/release.json'}
    if($name -eq 'index.html'){$source=Join-Path $workspace 'output/bamta-redesign-20261024/preview-index.html'}
    if((Get-FileHash -LiteralPath $target).Hash -ne (Get-FileHash -LiteralPath $source).Hash){throw "Public file differs: $name"}
  }
  Write-Output "PUBLIC_HASHES_MATCH $($names.Count) files"
  exit 0
 }
 throw 'Server deployment has not exposed the new version after 15 minutes.'
}
if($command -ne 'publish'){throw 'Publication was not started.'}
$env:GIT_INDEX_FILE=Join-Path $workspace 'output/bamta-redesign-20261024/publication.index'
try {
  for($attempt=1;$attempt -le 3;$attempt++){
    $null=Git @('fetch','origin','main')
    $head=Git @('rev-parse','origin/main')
    if((Git @('rev-parse',"$($head):AGENTS.md")) -ne $known){throw 'Project policy changed while preparing publication.'}
    $null=Git @('read-tree',$head)
    foreach($name in $names){
      $source=Join-Path $workspace ('arcade/bamta/'+$name)
      if($name -eq 'release.json'){$source=Join-Path $workspace 'output/bamta-redesign-20261024/release.json'}
      if($name -eq 'index.html'){
        $source=Join-Path $workspace 'output/bamta-redesign-20261024/preview-index.html'
        $html=[IO.File]::ReadAllText((Join-Path $workspace 'arcade/bamta/index.html'))

        [IO.File]::WriteAllText($source,$html,[Text.UTF8Encoding]::new($false))
      }
      $blob=Git @('hash-object','-w','--no-filters',$source)
      $null=Git @('update-index','--add','--cacheinfo',"100644,$blob,$prefix$name")
    }
    foreach($name in @('director-reference.webp','woman-reference.webp','male-colleague.webp','female-staff.webp')){$null=Git @('update-index','--force-remove',($prefix+'assets/art-v2/'+$name))}
    $tree=Git @('write-tree')
    $authorName=Git @('config','user.name');$authorEmail=Git @('config','user.email')
    $commit=Git @('-c',"user.name=$authorName",'-c',"user.email=$authorEmail",'commit-tree',$tree,'-p',$head,'-m','Deploy approved BTA redesign with fictional 3D heads and polite hallway dialogue')
    $changed=Git @('diff-tree','--no-commit-id','--name-only','-r',$commit)
    foreach($file in ($changed -split "`n")){if(-not $file.StartsWith($prefix)){throw "Out of scope publication file: $file"}}
    Write-Output $changed
    $null=Git @('fetch','origin','main')
    if((Git @('rev-parse','origin/main')) -ne $head){Write-Output 'Main advanced; preserving latest changes and retrying.';continue}
    & $git -C $workspace push origin "$($commit):refs/heads/main"
    if($LASTEXITCODE -eq 0){
      Write-Output "PUBLISHED_COMMIT $commit"
      [IO.File]::WriteAllText((Join-Path $workspace 'output/bamta-redesign-20261024/PUBLISHED.txt'),"$commit`nhttps://visual.newsis.com/arcade/bamta/?v=mesh1`n")
      exit 0
    }
  }
  throw 'Could not publish without overwriting concurrent work.'
} finally { Remove-Item Env:GIT_INDEX_FILE -ErrorAction SilentlyContinue }

