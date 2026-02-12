extends Area2D
# Goal/Exit - player wins when reaching this

func _ready():
	body_entered.connect(_on_body_entered)

func _on_body_entered(body):
	if body.is_in_group("player"):
		body.level_complete()
