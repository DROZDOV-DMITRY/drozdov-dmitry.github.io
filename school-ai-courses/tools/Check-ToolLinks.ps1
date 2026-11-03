[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\assets\tool-link-status.json'),
    [ValidateRange(3,120)][int]$TimeoutSeconds = 20,
    [ValidateRange(0,15)][int]$MaxRedirects = 10
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$pages = @(
    (Join-Path $RepoRoot 'school-ai-courses/tools/index.html'),
    (Join-Path $RepoRoot 'school-ai-courses/adults/tools/index.html')
)
$urls = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$actionPattern = '(?is)<div class="tool-actions-v2">(.*?)</div>'
$hrefPattern = '(?is)href=["''](https?://[^"'']+)["'']'
foreach ($page in $pages) {
    if (-not (Test-Path -LiteralPath $page)) { throw "Catalogue page not found: $page" }
    $html = [System.IO.File]::ReadAllText($page)
    foreach ($block in [regex]::Matches($html,$actionPattern)) {
        foreach ($match in [regex]::Matches($block.Groups[1].Value,$hrefPattern)) {
            [void]$urls.Add([System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value))
        }
    }
}
$handler=[System.Net.Http.HttpClientHandler]::new()
$handler.AllowAutoRedirect=$false
$client=[System.Net.Http.HttpClient]::new($handler)
$client.Timeout=[TimeSpan]::FromSeconds($TimeoutSeconds)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('School14-ToolLinkCheck/1.0')
$results=[ordered]@{}
foreach($url in ($urls | Sort-Object)){
    $current=[Uri]::new($url,[System.UriKind]::Absolute)
    $chain=[System.Collections.Generic.List[string]]::new()
    $state='UNKNOWN';$httpStatus=$null;$finalUrl=$url;$errorText=''
    $response=$null
    try{
        for($hop=0;;$hop++){
            $request=[System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get,$current)
            try{$response=$client.SendAsync($request,[System.Net.Http.HttpCompletionOption]::ResponseHeadersRead).GetAwaiter().GetResult()}finally{$request.Dispose()}
            $httpStatus=[int]$response.StatusCode
            if($httpStatus -in @(301,302,303,307,308) -and $response.Headers.Location){
                if($hop -ge $MaxRedirects){$state='REDIRECT_LIMIT';$finalUrl=$current.AbsoluteUri;break}
                $next=if($response.Headers.Location.IsAbsoluteUri){$response.Headers.Location}else{[Uri]::new($current,$response.Headers.Location)}
                $chain.Add($next.AbsoluteUri);$response.Dispose();$response=$null;$current=$next;continue
            }
            $finalUrl=$current.AbsoluteUri
            if($httpStatus -ge 200 -and $httpStatus -lt 300){$state=if($chain.Count -gt 0){'REDIRECTED'}else{'HTTP_OK'}}
            elseif($httpStatus -in @(401,402,403,407,429)){$state='BLOCKED_BY_SERVER'}
            elseif($httpStatus -in @(404,410)){$state='NOT_FOUND_REVIEW'}
            elseif($httpStatus -ge 500){$state='SERVER_ERROR'}
            else{$state='HTTP_OTHER_REVIEW'}
            break
        }
    }catch{
        $errorText=$_.Exception.GetBaseException().Message
        if($errorText -match 'timeout|timed out|canceled|cancelled'){$state='TIMEOUT'}
        elseif($errorText -match 'SSL|TLS|certificate|secure channel'){$state='TLS_ERROR'}
        elseif($errorText -match 'name.*resolve|No such host|DNS'){$state='DNS_ERROR'}
        else{$state='FETCH_ERROR'}
    }finally{if($response){$response.Dispose()}}
    $results[$url]=[ordered]@{status=$state;http_status=$httpStatus;final_url=$finalUrl;redirect_chain=@($chain);error=$errorText}
}
$client.Dispose();$handler.Dispose()
$report=[ordered]@{schema_version=1;checked_at=(Get-Date).ToString('o');checker='PowerShell HttpClient 1.0';scope='Public HTTP reachability only; does not verify login, region, price, official ownership, product function, or successful generation.';links=$results}
$json=$report|ConvertTo-Json -Depth 8
$parent=Split-Path -Parent $OutputPath
if(-not(Test-Path -LiteralPath $parent)){New-Item -ItemType Directory -Path $parent -Force|Out-Null}
[System.IO.File]::WriteAllText($OutputPath,$json,[System.Text.UTF8Encoding]::new($true))
$results.Values|Group-Object status|Sort-Object Name|ForEach-Object{('{0}: {1}' -f $_.Name,$_.Count)}
"Saved: $OutputPath"
