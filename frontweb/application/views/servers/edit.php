<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed'); ?>
<head>
	<script src="./textext/js/jquery.min.js"></script>
	<script src="./textext/js/textext.plugin.autocomplete.js"></script>
	<script src="./textext/js/jquery.textext.js"></script>
	<script src="./textext/js/gbin.js"></script>
</head>

<div class="page-header">
  <h4>编辑主机>>&nbsp;<a href="<?php echo site_url('servers/add') ?>">&nbsp;&nbsp;新增&nbsp;</a>/<a href="<?php echo site_url('servers/index') ?>">&nbsp;&nbsp;列表&nbsp;</a>/<a  href="<?php echo site_url('servers/trash') ?>">&nbsp;&nbsp;回收站&nbsp;</a></h4>
</div>
  
<hr/>               

<?php if ($error_code!==0) { ?>
<div class="ui-widget">
<div class="ui-state-error   ui-corner-all">
<p><span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em;"></span>
<?php echo validation_errors(); ?></p>
</div>
</div>

<?php } ?>

<form name="form" class="form-horizontal" method="post" action="<?php echo site_url('servers/edit') ?>" >
<input type="hidden" name="submit" value="edit"/> 
<input type='hidden' name='id' value=<?php echo $record['id'] ?> />
    <div class="control-group">
    <label class="control-label" for="">*主机</label>
    <div class="controls">
      <input type="text" id="host"  name="host" value="<?php echo $record['host']; ?>" >
      <span class="help-inline"></span>
    </div>
   </div>
   <div class="control-group">
    <label class="control-label" for="">*端口</label>
    <div class="controls">
      <input type="text" id="port"  name="port" value="<?php echo $record['port']; ?>" >
      <span class="help-inline"></span>
    </div>
   </div>
   <div class="control-group">
    <label class="control-label" for="">密码</label>
    <div class="controls">
      <input type="text" id="passwd"  name="passwd" value="<?php echo $record['passwd']; ?>" >
      <span class="help-inline"></span>
    </div>
   </div>

   <div class="control-group">
    <label class="control-label" for="">选择业务</label>
    <div class="controls">
        <select name="application_id" id="application_id">
        <option value=""  >选择业务</option>
        <?php if(!empty($application)) {?>
        <?php foreach ($application  as $item):?>
         <option value="<?php echo $item['id']?>" <?php echo set_selected($item['id'],$record['application_id']) ?> ><?php echo $item['name']?>(<?php echo $item['display_name']?>)</option>
        <?php endforeach;?>
        <?php } ?>
        </select>
        <span class="help-inline">请按业务对主机进行分类</span>
    </div>
   </div> 
    
    <div class="control-group">
    <label class="control-label" for="">监控状态</label>
    <div class="controls">
        <select name="status" id="status" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['status']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['status']) ?>>关闭</option>
        </select>
        <span class="help-inline">总开关</span>
    </div>
   </div>
    
    <div class="control-group">
    <label class="control-label" for="">发送告警</label>
    <div class="controls">
        <select name="send_mail" id="send_mail" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['send_mail']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['send_mail']) ?>>关闭</option>
        </select>
               告警间隔&nbsp;
		<select name="alarm_interval" id="alarm_interval" class="input-small">
         <option value="30" <?php echo set_selected(30,$record['alarm_interval']) ?>>30s</option>
         <option value="60" <?php echo set_selected(60,$record['alarm_interval']) ?>>60s</option>
         <option value="120" <?php echo set_selected(120,$record['alarm_interval']) ?>>120s</option>
         <option value="180" <?php echo set_selected(180,$record['alarm_interval']) ?>>180s</option>
         <option value="300" <?php echo set_selected(300,$record['alarm_interval']) ?>>300s</option>
         <option value="600" <?php echo set_selected(600,$record['alarm_interval']) ?>>600s</option>
         <option value="1200" <?php echo set_selected(1200,$record['alarm_interval']) ?>>1200s</option>
        </select>
       告警方式&nbsp;
        <select name="alarm_type" id="alarm_type" class="input-small">
         <option value="0" <?php echo set_selected(0,$record['alarm_type']) ?>>邮件</option>
         <option value="1" <?php echo set_selected(1,$record['alarm_type']) ?>>邮件+短信</option>
         <option value="2" <?php echo set_selected(2,$record['alarm_type']) ?>>邮件+微信</option>
        </select>
        收敛方式&nbsp;
        <select name="converge_type" id="converge_type" class="input-small">
         <option value="0" <?php echo set_selected(0,$record['converge_type']) ?>>不收敛</option>
         <option value="1" <?php echo set_selected(1,$record['converge_type']) ?>>递增收敛</option>
         <option value="2" <?php echo set_selected(2,$record['converge_type']) ?>>倍增*2收敛</option>
        </select>
    </div>
   </div>
   
    <div class="control-group">
    <label class="control-label" for="">总连接数告警</label>
    <div class="controls">
        <select name="alarm_connections" id="alarm_connections" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['alarm_connections']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['alarm_connections']) ?>>关闭</option>
        </select>
        告警阀值&nbsp;<input type="text" id="threshold_connections" class="input-small" placeholder="告警阀值" name="threshold_connections" value="<?php echo $record['threshold_connections']; ?>" >
        <span class="help-inline">% 总连接数使用率,取值范围0~100,建议值90%</span>
    </div>
   </div>
   
    <div class="control-group">
    <label class="control-label" for="">内存告警</label>
    <div class="controls">
        <select name="alarm_used_memory" id="alarm_used_memory" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['alarm_used_memory']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['alarm_used_memory']) ?>>关闭</option>
        </select>
        告警阀值&nbsp;<input type="text" id="threshold_used_memory" class="input-small" placeholder="告警阀值" name="threshold_used_memory" value="<?php echo $record['threshold_used_memory']; ?>" >
        <span class="help-inline">% 内存使用率,取值范围0~100,建议值90%</span>
    </div>
   </div>
    <div class="control-group">
    <label class="control-label" for="">复制状态告警</label>
    <div class="controls">
        <select name="alarm_repl_status" id="alarm_repl_status" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['alarm_repl_status']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['alarm_repl_status']) ?>>关闭</option>
        </select>
    </div>
   </div>
    <div class="control-group">
    <label class="control-label" for="">复制延迟告警</label>
    <div class="controls">
        <select name="alarm_repl_delay" id="alarm_repl_delay" class="input-small">
         <option value="1"  <?php echo set_selected(1,$record['alarm_repl_delay']) ?>>开启</option>
         <option value="0"  <?php echo set_selected(0,$record['alarm_repl_delay']) ?>>关闭</option>
        </select>
        告警阀值&nbsp;<input type="text" id="threshold_repl_delay" class="input-small" placeholder="告警阀值" name="threshold_repl_delay" value="<?php echo $record['threshold_repl_delay']; ?>" >
        <span class="help-inline">主备同步偏移差值,建议取值范围--待定</span>
    </div>
   </div>

   <div class="control-group">
    <label class="control-label" for="">告警接收人</label>
    <div class="controls">
      <input type="text" id="alarm_person"  name="alarm_person" value="<?php echo $record['alarm_person']; ?>" class="input-xxlarge">
      <span class="help-inline">多人请用 ;分割</span>
    </div>
   </div>

  <div class="control-group">
    <div class="controls">
      <button type="submit" class="btn btn-success">提 交</button> &nbsp;我想放弃提交，<a href='<?php echo site_url('servers/index')?>'>点此返回</a>
    </div>
  </div>
                                    
</form>

